// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAerodromeRouter {
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
}

contract PredictionMarketFactory {
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
    }

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public yesBets;
    mapping(uint256 => mapping(address => uint256)) public noBets;
    uint256 public marketCount;

    event MarketCreated(uint256 indexed marketId, string question);
    event BetPlaced(uint256 indexed marketId, address indexed user, bool betYes, uint256 amount);
    event MarketResolved(uint256 indexed marketId, bool result);

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

    function createMarket(string calldata _question) external onlyAgent returns (uint256) {
        uint256 marketId = marketCount++;
        markets[marketId].question = _question;
        emit MarketCreated(marketId, _question);
        return marketId;
    }

    function placeBet(uint256 _marketId, bool _betYes) external payable {
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

    function resolveMarket(uint256 _marketId, bool _result) external onlyAgent {
        Market storage market = markets[_marketId];
        require(!market.resolved, "Already resolved");

        market.resolved = true;
        market.result = _result;

        _routeFees(market.ethPool);

        emit MarketResolved(_marketId, _result);
    }

    function _routeFees(uint256 _totalPool) private {
        uint256 totalFee = (_totalPool * PROTOCOL_FEE_BPS) / 10000;
        
        uint256 creatorFee = (totalFee * CREATOR_SHARE_BPS) / 10000;
        uint256 agentFee = (totalFee * AGENT_SHARE_BPS) / 10000;
        uint256 burnFee = (totalFee * BURN_SHARE_BPS) / 10000;

        // Send to Creator
        (bool s1, ) = CREATOR_WALLET.call{value: creatorFee}("");
        require(s1, "Creator fee fail");

        // Send to Agent
        (bool s2, ) = AGENT_X402_WALLET.call{value: agentFee}("");
        require(s2, "Agent fee fail");

        // Buy and Burn via Aerodrome
        _buyAndBurn(burnFee);
    }

    function _buyAndBurn(uint256 _amount) private {
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = CHAOS_TOKEN;

        IAerodromeRouter(AERODROME_ROUTER).swapExactETHForTokens{value: _amount}(
            0, // amountOutMin: Slippage check should be added for production
            path,
            address(0), // Burn address
            block.timestamp + 60
        );
    }

    receive() external payable {}
}
