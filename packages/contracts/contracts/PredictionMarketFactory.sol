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

contract PredictionMarketFactory is ReentrancyGuard {
    address public immutable CREATOR_WALLET;
    address public immutable AGENT_X402_WALLET;
    address public immutable CHAOS_TOKEN;
    address public immutable AERODROME_ROUTER;
    address public immutable WETH;

    uint256 public constant PROTOCOL_FEE_BPS = 250; // 2.5%
    uint256 public constant CREATOR_SHARE_BPS = 900; // 9% of 2.5%
    uint256 public constant AGENT_SHARE_BPS = 100;  // 1% of 2.5%
    uint256 public constant BURN_SHARE_BPS = 9000; // 90% of 2.5%

    struct Market {
        string question;
        uint256 totalYes;
        uint256 totalNo;
        bool resolved;
        bool result; // true = Yes, false = No
        uint256 ethPool;
        uint256 finalFee; // Set upon resolution
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

    constructor(
        address _creator,
        address _agent,
        address _chaosToken,
        address _router,
        address _weth
    ) {
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

    // REMOVED onlyAgent so anyone can deploy a market
    function createMarket(string calldata _question) external returns (uint256) {
        uint256 marketId = marketCount++;
        markets[marketId].question = _question;
        emit MarketCreated(marketId, _question, msg.sender);
        return marketId;
    }

    function placeBet(uint256 _marketId, bool _betYes) external payable nonReentrant {
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

        market.resolved = true;
        market.result = _result;

        uint256 totalFee = (market.ethPool * PROTOCOL_FEE_BPS) / 10000;
        market.finalFee = totalFee;

        _routeFees(totalFee);

        emit MarketResolved(_marketId, _result);
    }

    function claim(uint256 _marketId) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.resolved, "Not resolved yet");
        require(!hasClaimed[_marketId][msg.sender], "Already claimed");

        uint256 userBet = market.result ? yesBets[_marketId][msg.sender] : noBets[_marketId][msg.sender];
        require(userBet > 0, "No winning bet");

        hasClaimed[_marketId][msg.sender] = true;

        uint256 winningPool = market.result ? market.totalYes : market.totalNo;
        uint256 totalPayoutPool = market.ethPool - market.finalFee;

        // Calculate proportional share
        uint256 userPayout = (userBet * totalPayoutPool) / winningPool;

        (bool success, ) = msg.sender.call{value: userPayout}("");
        require(success, "Transfer failed");

        emit WinningsClaimed(_marketId, msg.sender, userPayout);
    }

    function _routeFees(uint256 totalFee) private {
        if (totalFee == 0) return;

        uint256 creatorFee = (totalFee * CREATOR_SHARE_BPS) / 10000;
        uint256 agentFee = (totalFee * AGENT_SHARE_BPS) / 10000;
        uint256 burnFee = (totalFee * BURN_SHARE_BPS) / 10000;

        // Send to Creator
        (bool s1, ) = CREATOR_WALLET.call{value: creatorFee}("");
        require(s1, "Creator fee fail");

        // Send to Agent
        (bool s2, ) = AGENT_X402_WALLET.call{value: agentFee}("");
        require(s2, "Agent fee fail");

        // Buy and Burn via Aerodrome (fail silently to not block resolution)
        if (AERODROME_ROUTER != address(0)) {
            try this.buyAndBurn{value: burnFee}(burnFee) {} catch {}
        }
    }

    // External wrapper for try/catch in _routeFees
    function buyAndBurn(uint256 _amount) external payable {
        require(msg.sender == address(this), "Internal only");
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = CHAOS_TOKEN;

        IAerodromeRouter(AERODROME_ROUTER).swapExactETHForTokens{value: _amount}(
            0, 
            path,
            address(0), 
            block.timestamp + 60
        );
    }

    receive() external payable {}
}
