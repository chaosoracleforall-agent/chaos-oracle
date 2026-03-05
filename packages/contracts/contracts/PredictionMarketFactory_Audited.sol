// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;
    constructor() { _status = _NOT_ENTERED; }
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

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

    uint256 public constant PROTOCOL_FEE_BPS = 250; 
    uint256 public constant CREATOR_SHARE_BPS = 900; 
    uint256 public constant AGENT_SHARE_BPS = 100;  
    uint256 public constant BURN_SHARE_BPS = 9000; 

    struct Market {
        string question;
        uint256 totalYes;
        uint256 totalNo;
        uint256 ethPool;
        uint256 feesTaken;
        bool resolved;
        bool result;
    }

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public yesBets;
    mapping(uint256 => mapping(address => uint256)) public noBets;
    mapping(uint256 => mapping(address => bool)) public winningsClaimed;
    uint256 public marketCount;

    event MarketCreated(uint256 indexed marketId, string question);
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
        require(_creator != address(0) && _agent != address(0), "Invalid addresses");
        CREATOR_WALLET = _creator;
        AGENT_X402_WALLET = _agent;
        CHAOS_TOKEN = _chaosToken;
        AERODROME_ROUTER = _router;
        WETH = _weth;
    }

    modifier onlyAgent() {
        require(msg.sender == AGENT_X402_WALLET, "Only Chaos Oracle can execute");
        _;
    }

    function createMarket(string calldata _question) external onlyAgent returns (uint256) {
        uint256 marketId = marketCount++;
        markets[marketId].question = _question;
        emit MarketCreated(marketId, _question);
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

    function resolveMarket(uint256 _marketId, bool _result, uint256 _amountOutMin) external onlyAgent nonReentrant {
        Market storage market = markets[_marketId];
        require(!market.resolved, "Already resolved");
        market.resolved = true;
        market.result = _result;
        uint256 totalFee = (market.ethPool * PROTOCOL_FEE_BPS) / 10000;
        market.feesTaken = totalFee;
        _routeFees(totalFee, _amountOutMin);
        emit MarketResolved(_marketId, _result);
    }

    function claimWinnings(uint256 _marketId) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved");
        require(!winningsClaimed[_marketId][msg.sender], "Already claimed");
        uint256 userBet = market.result ? yesBets[_marketId][msg.sender] : noBets[_marketId][msg.sender];
        require(userBet > 0, "No winning bet");
        uint256 winningPool = market.result ? market.totalYes : market.totalNo;
        uint256 netPool = market.ethPool - market.feesTaken;
        uint256 payout = (userBet * netPool) / winningPool;
        winningsClaimed[_marketId][msg.sender] = true;
        (bool success, ) = msg.sender.call{value: payout}("");
        require(success, "Payout failed");
        emit WinningsClaimed(_marketId, msg.sender, payout);
    }

    function _routeFees(uint256 _totalFee, uint256 _amountOutMin) private {
        uint256 creatorFee = (_totalFee * CREATOR_SHARE_BPS) / 10000;
        uint256 agentFee = (_totalFee * AGENT_SHARE_BPS) / 10000;
        uint256 burnFee = _totalFee - creatorFee - agentFee;
        (bool s1, ) = CREATOR_WALLET.call{value: creatorFee}("");
        require(s1, "Creator fee fail");
        (bool s2, ) = AGENT_X402_WALLET.call{value: agentFee}("");
        require(s2, "Agent fee fail");
        _buyAndBurn(burnFee, _amountOutMin);
    }

    function _buyAndBurn(uint256 _amount, uint256 _amountOutMin) private {
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = CHAOS_TOKEN;
        IAerodromeRouter(AERODROME_ROUTER).swapExactETHForTokens{value: _amount}(
            _amountOutMin,
            path,
            address(0),
            block.timestamp + 300
        );
    }

    receive() external payable {}
}
