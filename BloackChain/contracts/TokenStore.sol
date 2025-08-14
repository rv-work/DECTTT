// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GameToken.sol";

contract TokenStore is Ownable, ReentrancyGuard {
    IERC20 public immutable usdtToken;
    GameToken public immutable gameToken;
    
    // USDT has 6 decimals, GT has 18 decimals
    // Rate: 1 USDT = 1 GT
    uint256 public constant CONVERSION_RATE = 1e12; // 10^18 / 10^6
    
    event Purchase(address indexed buyer, uint256 usdtAmount, uint256 gtAmount);
    event USDTWithdrawn(address indexed to, uint256 amount);
    
    constructor(address _usdtToken, address _gameToken) Ownable(msg.sender) {
        require(_usdtToken != address(0), "Invalid USDT address");
        require(_gameToken != address(0), "Invalid GameToken address");
        
        usdtToken = IERC20(_usdtToken);
        gameToken = GameToken(_gameToken);
    }
    
    function buy(uint256 usdtAmount) external nonReentrant {
        require(usdtAmount > 0, "Amount must be greater than zero");
        require(usdtToken.balanceOf(msg.sender) >= usdtAmount, "Insufficient USDT balance");
        require(usdtToken.allowance(msg.sender, address(this)) >= usdtAmount, "Insufficient USDT allowance");
        
        // Calculate GT amount: 1 USDT = 1 GT (accounting for decimal differences)
        uint256 gtAmount = usdtAmount * CONVERSION_RATE;
        
        // Transfer USDT from buyer
        require(usdtToken.transferFrom(msg.sender, address(this), usdtAmount), "USDT transfer failed");
        
        // Mint GT to buyer
        gameToken.mint(msg.sender, gtAmount);
        
        emit Purchase(msg.sender, usdtAmount, gtAmount);
    }
    
    function withdrawUSDT(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be greater than zero");
        require(usdtToken.balanceOf(address(this)) >= amount, "Insufficient USDT balance");
        
        require(usdtToken.transfer(to, amount), "USDT transfer failed");
        
        emit USDTWithdrawn(to, amount);
    }
    
    function getUSDTBalance() external view returns (uint256) {
        return usdtToken.balanceOf(address(this));
    }
}