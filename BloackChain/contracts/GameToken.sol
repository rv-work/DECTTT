// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameToken is ERC20, Ownable {
    address public tokenStore;
    
    event TokenStoreSetter(address indexed newTokenStore);
    
    modifier onlyTokenStore() {
        require(msg.sender == tokenStore, "Only TokenStore can mint");
        _;
    }
    
    constructor() ERC20("Game Token", "GT") Ownable(msg.sender) {}
    
    function setTokenStore(address _tokenStore) external onlyOwner {
        require(_tokenStore != address(0), "Invalid address");
        tokenStore = _tokenStore;
        emit TokenStoreSetter(_tokenStore);
    }
    
    function mint(address to, uint256 amount) external onlyTokenStore {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        _mint(to, amount);
    }
    
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}