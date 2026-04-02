// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IAerodromeRouter {
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

contract PredictionMarketFactoryV3 is ReentrancyGuard, Ownable {
    // ============ ADDRESSES ============

    address public immutable CREATOR_WALLET;
    address public agentWallet; // Mutable (upgradeable by owner)
    IERC20 public chaosToken;
    address public immutable AERODROME_ROUTER;
    address public immutable WETH;

    // ============ FEE CONFIG ============

    uint256 public constant PROTOCOL_FEE_BPS = 250; // 2.5% of pool on resolution

    /// @dev Fee split: how the protocol fee is divided. Must sum to 10000.
    uint16 public burnBps = 9000;    // 90% of fee burned via buy-and-burn
    uint16 public creatorBps = 900;  // 9% of fee to creator wallet
    uint16 public agentBps = 100;    // 1% of fee to agent wallet

    // ============ CREATION FEES ============

    uint256 public constant STANDARD_CREATION_FEE = 0.001 ether;
    uint256 public constant FEATURED_CREATION_FEE = 0.01 ether;

    // ============ CHAOS TOKEN GATE ============

    uint256 public minChaosForCreation = 1000 * 1e18; // 1000 CHAOS tokens
    bool public chaosGateEnabled = false;

    // ============ CIRCUIT BREAKER ============

    bool public paused;

    // ============ DISPUTE / DEADLINE ============

    uint256 public constant DISPUTE_WINDOW = 1 days;
    uint256 public constant RECLAIM_GRACE_PERIOD = 7 days;

    // ============ STRUCTS ============

    struct Market {
        string question;
        uint256 totalYes;
        uint256 totalNo;
        bool resolved;
        bool result;
        uint256 ethPool;
        uint256 finalFee;
        address creator;
        uint256 deadline;   // Block timestamp after which market can be resolved
        bool featured;      // Whether this is a featured market
    }

    // ============ STATE ============

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public yesBets;
    mapping(uint256 => mapping(address => uint256)) public noBets;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => uint256) public resolvedAt; // marketId => resolution timestamp
    uint256 public marketCount;

    // ============ EVENTS ============

    event MarketCreated(uint256 indexed marketId, string question, address indexed creator, uint256 deadline, bool featured);
    event BetPlaced(uint256 indexed marketId, address indexed user, bool betYes, uint256 amount);
    event MarketResolved(uint256 indexed marketId, bool result);
    event ResolutionOverridden(uint256 indexed marketId, bool newResult);
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event NoWinnerRefund(uint256 indexed marketId, uint256 refundedAmount);
    event BetReclaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event AgentWalletUpdated(address indexed oldAgent, address indexed newAgent);
    event FeeConfigUpdated(uint16 burnBps, uint16 creatorBps, uint16 agentBps);
    event Paused(bool isPaused);

    // ============ MODIFIERS ============

    modifier onlyAgent() {
        require(msg.sender == agentWallet, "Only Chaos Oracle can resolve");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }

    // ============ CONSTRUCTOR ============

    constructor(
        address _creator,
        address _agent,
        address _chaosToken,
        address _router,
        address _weth
    ) Ownable(msg.sender) {
        require(_creator != address(0), "Invalid creator");
        require(_agent != address(0), "Invalid agent");
        CREATOR_WALLET = _creator;
        agentWallet = _agent;
        chaosToken = IERC20(_chaosToken);
        AERODROME_ROUTER = _router;
        WETH = _weth;
    }

    // ============ ADMIN FUNCTIONS ============

    /// @notice Update the agent wallet address. Only callable by contract owner.
    function updateAgentWallet(address newAgent) external onlyOwner {
        require(newAgent != address(0), "Invalid address");
        address oldAgent = agentWallet;
        agentWallet = newAgent;
        emit AgentWalletUpdated(oldAgent, newAgent);
    }

    /// @notice Update fee split configuration. Must sum to 10000 and burn >= 50%.
    function updateFeeConfig(uint16 newBurnBps, uint16 newCreatorBps, uint16 newAgentBps) external onlyOwner {
        require(newBurnBps + newCreatorBps + newAgentBps == 10000, "Must sum to 100%");
        require(newBurnBps >= 5000, "Burn must be >= 50%");
        burnBps = newBurnBps;
        creatorBps = newCreatorBps;
        agentBps = newAgentBps;
        emit FeeConfigUpdated(newBurnBps, newCreatorBps, newAgentBps);
    }

    /// @notice Toggle contract pause state (circuit breaker).
    function togglePause() external onlyOwner {
        paused = !paused;
        emit Paused(paused);
    }

    /// @notice Toggle the CHAOS token gate for market creation.
    function toggleChaosGate() external onlyOwner {
        chaosGateEnabled = !chaosGateEnabled;
    }

    /// @notice Update minimum CHAOS tokens required to create a market.
    function setMinChaosForCreation(uint256 newMin) external onlyOwner {
        minChaosForCreation = newMin;
    }

    /// @notice Override resolution during dispute window. Only callable by owner.
    function overrideResolution(uint256 _marketId, bool _newResult) external onlyOwner nonReentrant {
        Market storage market = markets[_marketId];
        require(market.resolved, "Not resolved yet");
        require(block.timestamp <= resolvedAt[_marketId] + DISPUTE_WINDOW, "Dispute window closed");

        market.result = _newResult;
        // Reset the dispute window from now
        resolvedAt[_marketId] = block.timestamp;

        emit ResolutionOverridden(_marketId, _newResult);
    }

    // ============ MARKET CREATION ============

    /// @notice Create a standard prediction market. Requires 0.001 ETH + optional CHAOS gate.
    /// @param _question The prediction question text.
    /// @param _deadline Block timestamp after which the market can be resolved.
    function createMarket(string calldata _question, uint256 _deadline) external payable whenNotPaused returns (uint256) {
        require(msg.value >= STANDARD_CREATION_FEE, "Creation fee: 0.001 ETH");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        // CHAOS token gate check
        if (chaosGateEnabled && address(chaosToken) != address(0)) {
            require(chaosToken.balanceOf(msg.sender) >= minChaosForCreation, "Insufficient CHAOS tokens");
        }

        uint256 marketId = marketCount++;
        Market storage m = markets[marketId];
        m.question = _question;
        m.creator = msg.sender;
        m.deadline = _deadline;
        m.featured = false;

        emit MarketCreated(marketId, _question, msg.sender, _deadline, false);

        // Route creation fee to burn $CHAOS
        if (AERODROME_ROUTER != address(0) && msg.value > 0) {
            try this.buyAndBurn{value: msg.value}(msg.value) {} catch {}
        }

        return marketId;
    }

    /// @notice Create a featured prediction market. Requires 0.01 ETH. Gets on-chain featured flag.
    /// @param _question The prediction question text.
    /// @param _deadline Block timestamp after which the market can be resolved.
    function createFeaturedMarket(string calldata _question, uint256 _deadline) external payable whenNotPaused returns (uint256) {
        require(msg.value >= FEATURED_CREATION_FEE, "Featured fee: 0.01 ETH");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        // CHAOS token gate check
        if (chaosGateEnabled && address(chaosToken) != address(0)) {
            require(chaosToken.balanceOf(msg.sender) >= minChaosForCreation, "Insufficient CHAOS tokens");
        }

        uint256 marketId = marketCount++;
        Market storage m = markets[marketId];
        m.question = _question;
        m.creator = msg.sender;
        m.deadline = _deadline;
        m.featured = true;

        emit MarketCreated(marketId, _question, msg.sender, _deadline, true);

        // Route creation fee to burn $CHAOS
        if (AERODROME_ROUTER != address(0) && msg.value > 0) {
            try this.buyAndBurn{value: msg.value}(msg.value) {} catch {}
        }

        return marketId;
    }

    // ============ BETTING ============

    /// @notice Place a bet on a market. Must send ETH > 0.
    function placeBet(uint256 _marketId, bool _betYes) external payable nonReentrant whenNotPaused {
        require(_marketId < marketCount, "Market does not exist");
        Market storage market = markets[_marketId];
        require(!market.resolved, "Market resolved");
        require(msg.value > 0, "Zero bet");

        if (_betYes) {
            yesBets[_marketId][msg.sender] += msg.value;
            market.totalYes += msg.value;
        } else {
            noBets[_marketId][msg.sender] += msg.value;
            market.totalNo += msg.value;
        }

        market.ethPool += msg.value;
        emit BetPlaced(_marketId, msg.sender, _betYes, msg.value);
    }

    // ============ RESOLUTION ============

    /// @notice Resolve a market. Only callable by agent after deadline.
    function resolveMarket(uint256 _marketId, bool _result) external onlyAgent nonReentrant whenNotPaused {
        Market storage market = markets[_marketId];
        require(!market.resolved, "Already resolved");
        require(market.ethPool > 0, "No bets placed");
        require(block.timestamp >= market.deadline, "Market deadline not reached");

        market.resolved = true;
        market.result = _result;
        resolvedAt[_marketId] = block.timestamp;

        uint256 winningPool = _result ? market.totalYes : market.totalNo;

        if (winningPool == 0) {
            // No one bet on the winning side — refund all bettors minus protocol fee
            uint256 totalFee = (market.ethPool * PROTOCOL_FEE_BPS) / 10000;
            market.finalFee = totalFee;
            _routeFees(totalFee);
            emit NoWinnerRefund(_marketId, market.ethPool - totalFee);
        } else {
            uint256 totalFee = (market.ethPool * PROTOCOL_FEE_BPS) / 10000;
            market.finalFee = totalFee;
            _routeFees(totalFee);
        }

        emit MarketResolved(_marketId, _result);
    }

    // ============ CLAIMING ============

    /// @notice Claim winnings from a resolved market. Only available after dispute window.
    function claim(uint256 _marketId) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.resolved, "Not resolved yet");
        require(block.timestamp > resolvedAt[_marketId] + DISPUTE_WINDOW, "Dispute window active");
        require(!hasClaimed[_marketId][msg.sender], "Already claimed");

        uint256 winningPool = market.result ? market.totalYes : market.totalNo;
        uint256 totalPayoutPool = market.ethPool - market.finalFee;

        uint256 userBet;
        uint256 userPayout;

        if (winningPool == 0) {
            // No winner scenario: refund losing side proportionally
            uint256 losingPool = market.result ? market.totalNo : market.totalYes;
            require(losingPool > 0, "No funds to claim");
            userBet = market.result ? noBets[_marketId][msg.sender] : yesBets[_marketId][msg.sender];
            require(userBet > 0, "No bet to refund");
            userPayout = (userBet * totalPayoutPool) / losingPool;
        } else {
            userBet = market.result ? yesBets[_marketId][msg.sender] : noBets[_marketId][msg.sender];
            require(userBet > 0, "No winning bet");
            userPayout = (userBet * totalPayoutPool) / winningPool;
        }

        hasClaimed[_marketId][msg.sender] = true;

        (bool success, ) = msg.sender.call{value: userPayout}("");
        require(success, "Transfer failed");

        emit WinningsClaimed(_marketId, msg.sender, userPayout);
    }

    /// @notice Reclaim bets if a market is not resolved within 7 days after its deadline.
    function reclaimBet(uint256 _marketId) external nonReentrant {
        Market storage market = markets[_marketId];
        require(!market.resolved, "Market already resolved");
        require(block.timestamp > market.deadline + RECLAIM_GRACE_PERIOD, "Reclaim period not reached");
        require(!hasClaimed[_marketId][msg.sender], "Already reclaimed");

        uint256 userYes = yesBets[_marketId][msg.sender];
        uint256 userNo = noBets[_marketId][msg.sender];
        uint256 totalBet = userYes + userNo;
        require(totalBet > 0, "No bets to reclaim");

        hasClaimed[_marketId][msg.sender] = true;

        // Zero out user bets
        if (userYes > 0) {
            yesBets[_marketId][msg.sender] = 0;
            market.totalYes -= userYes;
        }
        if (userNo > 0) {
            noBets[_marketId][msg.sender] = 0;
            market.totalNo -= userNo;
        }
        market.ethPool -= totalBet;

        (bool success, ) = msg.sender.call{value: totalBet}("");
        require(success, "Transfer failed");

        emit BetReclaimed(_marketId, msg.sender, totalBet);
    }

    // ============ FEE ROUTING ============

    function _routeFees(uint256 totalFee) private {
        if (totalFee == 0) return;

        uint256 creatorFee = (totalFee * creatorBps) / 10000;
        uint256 agentFee = (totalFee * agentBps) / 10000;
        uint256 burnFee = totalFee - creatorFee - agentFee; // Avoids rounding dust

        (bool s1, ) = CREATOR_WALLET.call{value: creatorFee}("");
        require(s1, "Creator fee fail");

        (bool s2, ) = agentWallet.call{value: agentFee}("");
        require(s2, "Agent fee fail");

        if (AERODROME_ROUTER != address(0) && burnFee > 0) {
            try this.buyAndBurn{value: burnFee}(burnFee) {} catch {}
        }
    }

    /// @notice Buy $CHAOS and send to burn address via Aerodrome.
    function buyAndBurn(uint256 _amount) external payable {
        require(msg.sender == address(this), "Internal only");
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = address(chaosToken);

        IAerodromeRouter(AERODROME_ROUTER).swapExactETHForTokens{value: _amount}(
            0, // On-chain, sandwich protection via private mempool or Flashbots recommended
            path,
            0x000000000000000000000000000000000000dEaD, // Burn address
            block.timestamp + 120
        );
    }

    // ============ VIEW HELPERS ============

    /// @notice Check if a market is featured.
    function isFeatured(uint256 _marketId) external view returns (bool) {
        return markets[_marketId].featured;
    }

    /// @notice Check if a market's dispute window is still active.
    function isDisputeWindowActive(uint256 _marketId) external view returns (bool) {
        if (!markets[_marketId].resolved) return false;
        return block.timestamp <= resolvedAt[_marketId] + DISPUTE_WINDOW;
    }

    /// @notice Check if bets can be reclaimed for a market (deadline + 7 days passed, not resolved).
    function canReclaim(uint256 _marketId) external view returns (bool) {
        Market storage m = markets[_marketId];
        if (m.resolved) return false;
        return block.timestamp > m.deadline + RECLAIM_GRACE_PERIOD;
    }

    receive() external payable {}
}
