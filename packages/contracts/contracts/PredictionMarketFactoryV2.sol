// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IAerodromeRouter {
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
}

contract PredictionMarketFactoryV2 is ReentrancyGuard, Pausable {
    address public immutable CREATOR_WALLET;
    address public immutable AGENT_WALLET;
    address public immutable CHAOS_TOKEN;
    address public immutable AERODROME_ROUTER;
    address public immutable WETH;
    address public immutable BURN_ADDRESS;

    uint256 public constant PROTOCOL_FEE_BPS = 250;      // 2.5%
    uint256 public constant CREATOR_SHARE_BPS = 900;      // 9% of fee
    uint256 public constant AGENT_SHARE_BPS = 100;        // 1% of fee
    uint256 public constant BURN_SHARE_BPS = 9000;        // 90% of fee
    uint256 public constant MARKET_CREATION_FEE = 0.001 ether;

    struct Market {
        string question;
        address creator;
        uint256 totalYes;
        uint256 totalNo;
        bool resolved;
        bool result;
        uint256 ethPool;
        uint256 finalFee;
        uint256 createdAt;
        uint256 resolvedAt;
    }

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public yesBets;
    mapping(uint256 => mapping(address => uint256)) public noBets;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    uint256 public marketCount;
    uint256 public totalBurned;

    // [HIGH-2 FIX] Pull-based fee collection
    mapping(address => uint256) public pendingFees;

    // [HIGH-3 FIX] Track failed burn ETH for retry
    uint256 public pendingBurnETH;

    event MarketCreated(uint256 indexed marketId, string question, address indexed creator, uint256 creationFee);
    event BetPlaced(uint256 indexed marketId, address indexed user, bool betYes, uint256 amount);
    event MarketResolved(uint256 indexed marketId, bool result, uint256 totalPool, uint256 fee);
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event BuyAndBurn(uint256 ethSpent, uint256 chaosReceived);
    event BuyAndBurnFailed(uint256 ethAmount, string reason);
    event RefundClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event EmergencyPause(address indexed by);
    event EmergencyUnpause(address indexed by);

    constructor(
        address _creator,
        address _agent,
        address _chaosToken,
        address _router,
        address _weth
    ) {
        require(_creator != address(0), "Invalid creator");
        require(_agent != address(0), "Invalid agent");
        require(_chaosToken != address(0), "Invalid token");
        require(_weth != address(0), "Invalid WETH");
        CREATOR_WALLET = _creator;
        AGENT_WALLET = _agent;
        CHAOS_TOKEN = _chaosToken;
        AERODROME_ROUTER = _router;
        WETH = _weth;
        BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    }

    modifier onlyAgent() {
        require(msg.sender == AGENT_WALLET, "Only agent can call");
        _;
    }

    // --- Market Creation ---

    function createMarket(string calldata _question) external payable whenNotPaused returns (uint256) {
        require(msg.value >= MARKET_CREATION_FEE, "Insufficient creation fee");
        require(bytes(_question).length > 0, "Empty question");
        require(bytes(_question).length <= 500, "Question too long");

        uint256 marketId = marketCount++;
        Market storage m = markets[marketId];
        m.question = _question;
        m.creator = msg.sender;
        m.createdAt = block.timestamp;

        // [MEDIUM-1 FIX] Send exactly MARKET_CREATION_FEE, refund overpayment
        (bool s, ) = AGENT_WALLET.call{value: MARKET_CREATION_FEE}("");
        require(s, "Fee transfer failed");

        if (msg.value > MARKET_CREATION_FEE) {
            (bool refund, ) = msg.sender.call{value: msg.value - MARKET_CREATION_FEE}("");
            require(refund, "Refund failed");
        }

        emit MarketCreated(marketId, _question, msg.sender, MARKET_CREATION_FEE);
        return marketId;
    }

    // --- Betting ---

    function placeBet(uint256 _marketId, bool _betYes) external payable nonReentrant whenNotPaused {
        require(_marketId < marketCount, "Market does not exist");
        Market storage m = markets[_marketId];
        require(!m.resolved, "Market resolved");
        require(msg.value > 0, "Zero bet");

        if (_betYes) {
            yesBets[_marketId][msg.sender] += msg.value;
            m.totalYes += msg.value;
        } else {
            noBets[_marketId][msg.sender] += msg.value;
            m.totalNo += msg.value;
        }

        m.ethPool += msg.value;
        emit BetPlaced(_marketId, msg.sender, _betYes, msg.value);
    }

    // --- Resolution ---

    function resolveMarket(uint256 _marketId, bool _result) external onlyAgent nonReentrant whenNotPaused {
        require(_marketId < marketCount, "Market does not exist");
        Market storage m = markets[_marketId];
        require(!m.resolved, "Already resolved");

        m.resolved = true;
        m.result = _result;
        m.resolvedAt = block.timestamp;

        uint256 winningPool = _result ? m.totalYes : m.totalNo;

        if (winningPool == 0) {
            m.finalFee = 0;
            emit MarketResolved(_marketId, _result, m.ethPool, 0);
            return;
        }

        uint256 totalFee = (m.ethPool * PROTOCOL_FEE_BPS) / 10000;
        m.finalFee = totalFee;

        _routeFees(totalFee);

        emit MarketResolved(_marketId, _result, m.ethPool, totalFee);
    }

    // --- Claiming ---

    function claim(uint256 _marketId) external nonReentrant {
        require(_marketId < marketCount, "Market does not exist");
        Market storage m = markets[_marketId];
        require(m.resolved, "Not resolved");
        require(!hasClaimed[_marketId][msg.sender], "Already claimed");

        bool result = m.result;
        uint256 winningPool = result ? m.totalYes : m.totalNo;
        require(winningPool > 0, "No winners");

        uint256 userBet = result ? yesBets[_marketId][msg.sender] : noBets[_marketId][msg.sender];
        require(userBet > 0, "No winning bet");

        hasClaimed[_marketId][msg.sender] = true;

        uint256 totalPayoutPool = m.ethPool - m.finalFee;
        uint256 userPayout = (userBet * totalPayoutPool) / winningPool;

        (bool success, ) = msg.sender.call{value: userPayout}("");
        require(success, "Transfer failed");

        emit WinningsClaimed(_marketId, msg.sender, userPayout);
    }

    /// @notice Refund losers when no one bet on the winning side (division-by-zero protection)
    function claimRefund(uint256 _marketId) external nonReentrant {
        require(_marketId < marketCount, "Market does not exist");
        Market storage m = markets[_marketId];
        require(m.resolved, "Not resolved");
        require(!hasClaimed[_marketId][msg.sender], "Already claimed");

        bool result = m.result;
        uint256 winningPool = result ? m.totalYes : m.totalNo;
        require(winningPool == 0, "Winners exist, use claim()");

        uint256 userBet = result ? noBets[_marketId][msg.sender] : yesBets[_marketId][msg.sender];
        require(userBet > 0, "No bet to refund");

        hasClaimed[_marketId][msg.sender] = true;

        (bool success, ) = msg.sender.call{value: userBet}("");
        require(success, "Refund failed");

        emit RefundClaimed(_marketId, msg.sender, userBet);
    }

    // --- Fee Routing ---

    // [HIGH-2 FIX] Pull-based fee collection — fees are escrowed, not pushed
    function _routeFees(uint256 totalFee) private {
        if (totalFee == 0) return;

        uint256 creatorFee = (totalFee * CREATOR_SHARE_BPS) / 10000;
        uint256 agentFee = (totalFee * AGENT_SHARE_BPS) / 10000;
        uint256 burnFee = totalFee - creatorFee - agentFee;

        pendingFees[CREATOR_WALLET] += creatorFee;
        pendingFees[AGENT_WALLET] += agentFee;

        // Attempt buy-and-burn, escrow on failure
        if (AERODROME_ROUTER != address(0) && burnFee > 0) {
            try this.buyAndBurn(burnFee) {} catch {
                pendingBurnETH += burnFee;
                emit BuyAndBurnFailed(burnFee, "Swap failed");
            }
        } else {
            pendingBurnETH += burnFee;
        }
    }

    /// @notice Withdraw accumulated fees (pull pattern)
    function withdrawFees() external nonReentrant {
        uint256 amount = pendingFees[msg.sender];
        require(amount > 0, "No fees to withdraw");
        pendingFees[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdraw failed");
        emit FeesWithdrawn(msg.sender, amount);
    }

    // [HIGH-3 FIX] Retry failed burn operations
    function retryBurn() external onlyAgent nonReentrant {
        require(pendingBurnETH > 0, "Nothing to retry");
        uint256 amount = pendingBurnETH;
        pendingBurnETH = 0;
        try this.buyAndBurn(amount) {} catch {
            pendingBurnETH = amount;
            emit BuyAndBurnFailed(amount, "Retry failed");
        }
    }

    function buyAndBurn(uint256 _amount) external payable {
        require(msg.sender == address(this), "Internal only");

        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = CHAOS_TOKEN;

        uint256[] memory amounts = IAerodromeRouter(AERODROME_ROUTER).swapExactETHForTokens{value: _amount}(
            0, // On Base L2, sequencer provides FIFO ordering; MEV risk is minimal
            path,
            BURN_ADDRESS,
            block.timestamp + 300
        );

        totalBurned += amounts[amounts.length - 1];
        emit BuyAndBurn(_amount, amounts[amounts.length - 1]);
    }

    // --- Emergency Controls ---

    function pause() external onlyAgent {
        _pause();
        emit EmergencyPause(msg.sender);
    }

    function unpause() external onlyAgent {
        _unpause();
        emit EmergencyUnpause(msg.sender);
    }

    // --- View Functions ---

    function getMarket(uint256 _marketId) external view returns (
        string memory question,
        address creator,
        uint256 totalYes,
        uint256 totalNo,
        bool resolved,
        bool result,
        uint256 ethPool,
        uint256 finalFee,
        uint256 createdAt,
        uint256 resolvedAt
    ) {
        Market storage m = markets[_marketId];
        return (m.question, m.creator, m.totalYes, m.totalNo, m.resolved, m.result, m.ethPool, m.finalFee, m.createdAt, m.resolvedAt);
    }

    function getUserBets(uint256 _marketId, address _user) external view returns (uint256 yes, uint256 no) {
        return (yesBets[_marketId][_user], noBets[_marketId][_user]);
    }

    receive() external payable {}
}
