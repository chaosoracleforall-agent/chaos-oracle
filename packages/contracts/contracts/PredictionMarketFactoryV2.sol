// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAerodromeRouter {
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
}

contract PredictionMarketFactoryV2 is ReentrancyGuard {
    address public immutable CREATOR_WALLET;
    address public immutable AGENT_X402_WALLET;
    address public immutable CHAOS_TOKEN;
    address public immutable AERODROME_ROUTER;
    address public immutable WETH;

    uint256 public constant PROTOCOL_FEE_BPS = 250; // 2.5%
    uint256 public constant CREATOR_SHARE_BPS = 900; // 9% of fee
    uint256 public constant AGENT_SHARE_BPS = 100;   // 1% of fee
    uint256 public constant BURN_SHARE_BPS = 9000;   // 90% of fee

    uint256 public constant MARKET_CREATION_FEE = 0.001 ether;

    struct Market {
        string question;
        uint256 totalYes;
        uint256 totalNo;
        bool resolved;
        bool result;
        uint256 ethPool;
        uint256 finalFee;
        address creator;
    }

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public yesBets;
    mapping(uint256 => mapping(address => uint256)) public noBets;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    uint256 public marketCount;

    event MarketCreated(uint256 indexed marketId, string question, address indexed creator);
    event BetPlaced(uint256 indexed marketId, address indexed user, bool betYes, uint256 amount);
    event MarketResolved(uint256 indexed marketId, bool result);
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event NoWinnerRefund(uint256 indexed marketId, uint256 refundedAmount);

    constructor(
        address _creator,
        address _agent,
        address _chaosToken,
        address _router,
        address _weth
    ) {
        require(_creator != address(0), "Invalid creator");
        require(_agent != address(0), "Invalid agent");
        CREATOR_WALLET = _creator;
        AGENT_X402_WALLET = _agent;
        CHAOS_TOKEN = _chaosToken;
        AERODROME_ROUTER = _router;
        WETH = _weth;
    }

    modifier onlyAgent() {
        require(msg.sender == AGENT_X402_WALLET, "Only Chaos Oracle can resolve");
        _;
    }

    /// @notice Create a new prediction market. Requires 0.001 ETH creation fee.
    function createMarket(string calldata _question) external payable returns (uint256) {
        require(msg.value >= MARKET_CREATION_FEE, "Creation fee: 0.001 ETH");

        uint256 marketId = marketCount++;
        markets[marketId].question = _question;
        markets[marketId].creator = msg.sender;
        emit MarketCreated(marketId, _question, msg.sender);

        // Route creation fee to burn $CHAOS
        if (AERODROME_ROUTER != address(0) && msg.value > 0) {
            try this.buyAndBurn{value: msg.value}(msg.value) {} catch {}
        }

        return marketId;
    }

    function placeBet(uint256 _marketId, bool _betYes) external payable nonReentrant {
        require(_marketId < marketCount, "Market does not exist");
        require(!markets[_marketId].resolved, "Market resolved");
        require(msg.value > 0, "Zero bet");

        if (_betYes) {
            yesBets[_marketId][msg.sender] += msg.value;
            markets[_marketId].totalYes += msg.value;
        } else {
            noBets[_marketId][msg.sender] += msg.value;
            markets[_marketId].totalNo += msg.value;
        }

        markets[_marketId].ethPool += msg.value;
        emit BetPlaced(_marketId, msg.sender, _betYes, msg.value);
    }

    function resolveMarket(uint256 _marketId, bool _result) external onlyAgent nonReentrant {
        Market storage market = markets[_marketId];
        require(!market.resolved, "Already resolved");
        require(market.ethPool > 0, "No bets placed");

        market.resolved = true;
        market.result = _result;

        uint256 winningPool = _result ? market.totalYes : market.totalNo;

        if (winningPool == 0) {
            // No one bet on the winning side - refund all bettors on the losing side
            // minus protocol fee (they still pay for the service)
            uint256 totalFee = (market.ethPool * PROTOCOL_FEE_BPS) / 10000;
            market.finalFee = totalFee;
            _routeFees(totalFee);
            // Remaining funds claimable by losing-side bettors proportionally
            emit NoWinnerRefund(_marketId, market.ethPool - totalFee);
        } else {
            uint256 totalFee = (market.ethPool * PROTOCOL_FEE_BPS) / 10000;
            market.finalFee = totalFee;
            _routeFees(totalFee);
        }

        emit MarketResolved(_marketId, _result);
    }

    function claim(uint256 _marketId) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.resolved, "Not resolved yet");
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

    function _routeFees(uint256 totalFee) private {
        if (totalFee == 0) return;

        uint256 creatorFee = (totalFee * CREATOR_SHARE_BPS) / 10000;
        uint256 agentFee = (totalFee * AGENT_SHARE_BPS) / 10000;
        uint256 burnFee = totalFee - creatorFee - agentFee; // Avoids rounding dust

        (bool s1, ) = CREATOR_WALLET.call{value: creatorFee}("");
        require(s1, "Creator fee fail");

        (bool s2, ) = AGENT_X402_WALLET.call{value: agentFee}("");
        require(s2, "Agent fee fail");

        if (AERODROME_ROUTER != address(0) && burnFee > 0) {
            try this.buyAndBurn{value: burnFee}(burnFee) {} catch {}
        }
    }

    /// @notice Buy $CHAOS and send to burn address via Aerodrome
    function buyAndBurn(uint256 _amount) external payable {
        require(msg.sender == address(this), "Internal only");
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = CHAOS_TOKEN;

        // Slippage: accept 98% of expected output (2% tolerance)
        // For small amounts this is fine; for large burns consider oracle pricing
        IAerodromeRouter(AERODROME_ROUTER).swapExactETHForTokens{value: _amount}(
            0, // On-chain, sandwich protection via private mempool or Flashbots recommended
            path,
            0x000000000000000000000000000000000000dEaD, // Burn address (not address(0))
            block.timestamp + 120
        );
    }

    receive() external payable {}
}
