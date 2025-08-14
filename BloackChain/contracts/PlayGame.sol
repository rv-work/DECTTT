// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PlayGame is Ownable, ReentrancyGuard {
    IERC20 public immutable gameToken;
    
    enum MatchStatus { CREATED, STAKED, SETTLED, REFUNDED }
    
    struct Match {
        bytes32 matchId;
        address player1;
        address player2;
        uint256 stakeAmount;
        MatchStatus status;
        bool player1Staked;
        bool player2Staked;
        address winner;
        uint256 createdAt;
    }
    
    mapping(bytes32 => Match) public matches;
    bytes32[] public activeMatches;
    
    uint256 public constant MATCH_TIMEOUT = 24 hours;
    address public operator;
    
    event MatchCreated(bytes32 indexed matchId, address indexed player1, address indexed player2, uint256 stakeAmount);
    event Staked(bytes32 indexed matchId, address indexed player, uint256 amount);
    event MatchReady(bytes32 indexed matchId);
    event Settled(bytes32 indexed matchId, address indexed winner, uint256 payout);
    event Refunded(bytes32 indexed matchId, address indexed player1, address indexed player2, uint256 stakeAmount);
    event OperatorSet(address indexed newOperator);
    
    modifier onlyOperator() {
        require(msg.sender == operator || msg.sender == owner(), "Only operator or owner");
        _;
    }
    
    constructor(address _gameToken) Ownable(msg.sender) {
        require(_gameToken != address(0), "Invalid GameToken address");
        gameToken = IERC20(_gameToken);
        operator = msg.sender;
    }
    
    function setOperator(address _operator) external onlyOwner {
        require(_operator != address(0), "Invalid address");
        operator = _operator;
        emit OperatorSet(_operator);
    }
    
    function createMatch(
        bytes32 matchId,
        address player1,
        address player2,
        uint256 stakeAmount
    ) external onlyOperator {
        require(matchId != bytes32(0), "Invalid match ID");
        require(player1 != address(0) && player2 != address(0), "Invalid player addresses");
        require(player1 != player2, "Players must be different");
        require(stakeAmount > 0, "Stake must be greater than zero");
        require(matches[matchId].matchId == bytes32(0), "Match already exists");
        
        matches[matchId] = Match({
            matchId: matchId,
            player1: player1,
            player2: player2,
            stakeAmount: stakeAmount,
            status: MatchStatus.CREATED,
            player1Staked: false,
            player2Staked: false,
            winner: address(0),
            createdAt: block.timestamp
        });
        
        activeMatches.push(matchId);
        
        emit MatchCreated(matchId, player1, player2, stakeAmount);
    }
    
    function placeStake(bytes32 matchId) external nonReentrant {
        Match storage match_ = matches[matchId];
        require(match_.matchId != bytes32(0), "Match does not exist");
        require(match_.status == MatchStatus.CREATED, "Invalid match status");
        require(msg.sender == match_.player1 || msg.sender == match_.player2, "Not a player in this match");
        require(gameToken.balanceOf(msg.sender) >= match_.stakeAmount, "Insufficient GT balance");
        require(gameToken.allowance(msg.sender, address(this)) >= match_.stakeAmount, "Insufficient GT allowance");
        
        bool isPlayer1 = (msg.sender == match_.player1);
        
        if (isPlayer1) {
            require(!match_.player1Staked, "Player1 already staked");
            match_.player1Staked = true;
        } else {
            require(!match_.player2Staked, "Player2 already staked");
            match_.player2Staked = true;
        }
        
        // Transfer GT from player
        require(gameToken.transferFrom(msg.sender, address(this), match_.stakeAmount), "GT transfer failed");
        
        emit Staked(matchId, msg.sender, match_.stakeAmount);
        
        // Check if both players have staked
        if (match_.player1Staked && match_.player2Staked) {
            match_.status = MatchStatus.STAKED;
            emit MatchReady(matchId);
        }
    }
    
    function commitResult(bytes32 matchId, address winner) external onlyOperator nonReentrant {
        Match storage match_ = matches[matchId];
        require(match_.matchId != bytes32(0), "Match does not exist");
        require(match_.status == MatchStatus.STAKED, "Match not ready for settlement");
        require(winner == match_.player1 || winner == match_.player2, "Invalid winner");
        
        match_.winner = winner;
        match_.status = MatchStatus.SETTLED;
        
        uint256 payout = match_.stakeAmount * 2; // Winner takes all
        
        // Transfer total stake to winner
        require(gameToken.transfer(winner, payout), "Payout transfer failed");
        
        _removeActiveMatch(matchId);
        
        emit Settled(matchId, winner, payout);
    }
    
    function refund(bytes32 matchId) external nonReentrant {
        Match storage match_ = matches[matchId];
        require(match_.matchId != bytes32(0), "Match does not exist");
        require(match_.status == MatchStatus.CREATED || match_.status == MatchStatus.STAKED, "Cannot refund settled match");
        require(
            block.timestamp >= match_.createdAt + MATCH_TIMEOUT || 
            msg.sender == owner() || 
            msg.sender == operator,
            "Refund not available yet"
        );
        
        match_.status = MatchStatus.REFUNDED;
        
        if (match_.player1Staked) {
            require(gameToken.transfer(match_.player1, match_.stakeAmount), "Player1 refund failed");
        }
        
        if (match_.player2Staked) {
            require(gameToken.transfer(match_.player2, match_.stakeAmount), "Player2 refund failed");
        }
        
        _removeActiveMatch(matchId);
        
        emit Refunded(matchId, match_.player1, match_.player2, match_.stakeAmount);
    }
    
    function _removeActiveMatch(bytes32 matchId) internal {
        for (uint256 i = 0; i < activeMatches.length; i++) {
            if (activeMatches[i] == matchId) {
                activeMatches[i] = activeMatches[activeMatches.length - 1];
                activeMatches.pop();
                break;
            }
        }
    }
    
    function getActiveMatches() external view returns (bytes32[] memory) {
        return activeMatches;
    }
    
    function getMatch(bytes32 matchId) external view returns (Match memory) {
        return matches[matchId];
    }
    
    function getActiveMatchCount() external view returns (uint256) {
        return activeMatches.length;
    }
}
