const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());


  console.log("Deploying Mock USDT...");
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  console.log("Mock USDT deployed to:", await mockUSDT.getAddress());

  console.log("Deploying GameToken...");
  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy();
  await gameToken.waitForDeployment();
  console.log("GameToken deployed to:", await gameToken.getAddress());

  console.log("Deploying TokenStore...");
  const TokenStore = await ethers.getContractFactory("TokenStore");
  const tokenStore = await TokenStore.deploy(
    await mockUSDT.getAddress(), 
    await gameToken.getAddress()
  );
  await tokenStore.waitForDeployment();
  console.log("TokenStore deployed to:", await tokenStore.getAddress());


  console.log("Setting TokenStore as minter...");
  await gameToken.setTokenStore(await tokenStore.getAddress());


  console.log("Deploying PlayGame...");
  const PlayGame = await ethers.getContractFactory("PlayGame");
  const playGame = await PlayGame.deploy(await gameToken.getAddress());
  await playGame.waitForDeployment();
  console.log("PlayGame deployed to:", await playGame.getAddress());

  const contracts = {
    mockUSDT: await mockUSDT.getAddress(),
    gameToken: await gameToken.getAddress(),
    tokenStore: await tokenStore.getAddress(),
    playGame: await playGame.getAddress(),
    network: await deployer.provider.getNetwork()
  };

  fs.writeFileSync('./contracts.json', JSON.stringify(contracts, null, 2));
  console.log("Contract addresses saved to contracts.json");


  console.log("Minting test USDT...");
  await mockUSDT.mint(deployer.address, ethers.parseUnits("1000", 6)); 
  console.log("Minted 1000 USDT to deployer");

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("Mock USDT:", contracts.mockUSDT);
  console.log("GameToken:", contracts.gameToken);
  console.log("TokenStore:", contracts.tokenStore);
  console.log("PlayGame:", contracts.playGame);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });