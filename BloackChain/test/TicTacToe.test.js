// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// describe("Tic Tac Toe Game Contracts", function () {
//   let mockUSDT, gameToken, tokenStore, playGame;
//   let owner, player1, player2, operator;

//   beforeEach(async function () {
//     [owner, player1, player2, operator] = await ethers.getSigners();

//     // Deploy Mock USDT
//     const MockUSDT = await ethers.getContractFactory("MockUSDT");
//     mockUSDT = await MockUSDT.deploy();
//     await mockUSDT.waitForDeployment();

//     // Deploy GameToken
//     const GameToken = await ethers.getContractFactory("GameToken");
//     gameToken = await GameToken.deploy();
//     await gameToken.waitForDeployment();

//     // Deploy TokenStore
//     const TokenStore = await ethers.getContractFactory("TokenStore");
//     tokenStore = await TokenStore.deploy(
//       await mockUSDT.getAddress(),
//       await gameToken.getAddress()
//     );
//     await tokenStore.waitForDeployment();

//     // Set TokenStore as minter
//     await gameToken.setTokenStore(await tokenStore.getAddress());

//     // Deploy PlayGame
//     const PlayGame = await ethers.getContractFactory("PlayGame");
//     playGame = await PlayGame.deploy(await gameToken.getAddress());
//     await playGame.waitForDeployment();

//     // Set operator
//     await playGame.setOperator(operator.address);

//     // Mint test USDT to players
//     await mockUSDT.mint(player1.address, ethers.parseUnits("100", 6));
//     await mockUSDT.mint(player2.address, ethers.parseUnits("100", 6));
//   });

//   describe("GameToken", function () {
//     it("Should have correct name and symbol", async function () {
//       expect(await gameToken.name()).to.equal("Game Token");
//       expect(await gameToken.symbol()).to.equal("GT");
//       expect(await gameToken.decimals()).to.equal(18);
//     });

//     it("Should only allow TokenStore to mint", async function () {
//       await expect(
//         gameToken.mint(player1.address, ethers.parseEther("100"))
//       ).to.be.revertedWith("Only TokenStore can mint");

//       // Should work from TokenStore
//       await gameToken.connect(tokenStore).mint(player1.address, ethers.parseEther("100"));
//       expect(await gameToken.balanceOf(player1.address)).to.equal(ethers.parseEther("100"));
//     });

//     it("Should allow owner to set TokenStore", async function () {
//       const newTokenStore = ethers.Wallet.createRandom().address;
//       await gameToken.setTokenStore(newTokenStore);
//       expect(await gameToken.tokenStore()).to.equal(newTokenStore);
//     });
//   });

//   describe("TokenStore", function () {
//     it("Should allow purchasing GT with USDT", async function () {
//       const usdtAmount = ethers.parseUnits("10", 6); // 10 USDT
//       const expectedGTAmount = ethers.parseEther("10"); // 10 GT

//       // Approve USDT
//       await mockUSDT.connect(player1).approve(await tokenStore.getAddress(), usdtAmount);

//       // Purchase GT
//       await expect(tokenStore.connect(player1).buy(usdtAmount))
//         .to.emit(tokenStore, "Purchase")
//         .withArgs(player1.address, usdtAmount, expectedGTAmount);

//       expect(await gameToken.balanceOf(player1.address)).to.equal(expectedGTAmount);
//       expect(await mockUSDT.balanceOf(await tokenStore.getAddress())).to.equal(usdtAmount);
//     });

//     it("Should reject purchase without sufficient USDT", async function () {
//       const usdtAmount = ethers.parseUnits("1000", 6); // More than player has

//       await expect(
//         tokenStore.connect(player1).buy(usdtAmount)
//       ).to.be.revertedWith("Insufficient USDT balance");
//     });

//     it("Should reject purchase without approval", async function () {
//       const usdtAmount = ethers.parseUnits("10", 6);

//       await expect(
//         tokenStore.connect(player1).buy(usdtAmount)
//       ).to.be.revertedWith("Insufficient USDT allowance");
//     });

//     it("Should allow owner to withdraw USDT", async function () {
//       const usdtAmount = ethers.parseUnits("10", 6);

//       // Player purchases GT
//       await mockUSDT.connect(player1).approve(await tokenStore.getAddress(), usdtAmount);
//       await tokenStore.connect(player1).buy(usdtAmount);

//       // Owner withdraws
//       await expect(tokenStore.withdrawUSDT(owner.address, usdtAmount))
//         .to.emit(tokenStore, "USDTWithdrawn")
//         .withArgs(owner.address, usdtAmount);

//       expect(await mockUSDT.balanceOf(owner.address)).to.equal(usdtAmount);
//     });
//   });

//   describe("PlayGame", function () {
//     beforeEach(async function () {
//       // Give players some GT
//       const usdtAmount = ethers.parseUnits("50", 6);

//       await mockUSDT.connect(player1).approve(await tokenStore.getAddress(), usdtAmount);
//       await tokenStore.connect(player1).buy(usdtAmount);

//       await mockUSDT.connect(player2).approve(await tokenStore.getAddress(), usdtAmount);
//       await tokenStore.connect(player2).buy(usdtAmount);
//     });

//     it("Should create a match", async function () {
//       const matchId = ethers.keccak256(ethers.toUtf8Bytes("match1"));
//       const stake = ethers.parseEther("10");

//       await expect(
//         playGame.connect(operator).createMatch(matchId, player1.address, player2.address, stake)
//       )
//         .to.emit(playGame, "MatchCreated")
//         .withArgs(matchId, player1.address, player2.address, stake);

//       const match = await playGame.getMatch(matchId);
//       expect(match.player1).to.equal(player1.address);
//       expect(match.player2).to.equal(player2.address);
//       expect(match.stake).to.equal(stake);
//       expect(match.status).to.equal(0); // CREATED
//     });

//     it("Should allow players to stake", async function () {
//       const matchId = ethers.keccak256(ethers.toUtf8Bytes("match1"));
//       const stake = ethers.parseEther("10");

//       // Create match
//       await playGame.connect(player2).stake(matchId);

//       // 4. Settle match
//       const player2BalanceBefore = await gameToken.balanceOf(player2.address);

//       await playGame.connect(operator).commitResult(matchId, player2.address);

//       const player2BalanceAfter = await gameToken.balanceOf(player2.address);
//       expect(player2BalanceAfter.sub(player2BalanceBefore)).to.equal(stake.mul(2));

//       // 5. Verify match is settled
//       const match = await playGame.getMatch(matchId);
//       expect(match.status).to.equal(2); // SETTLED
//       expect(match.winner).to.equal(player2.address);
//     });
//   });
// });Game.connect(operator).createMatch(matchId, player1.address, player2.address, stake);

//       // Players approve GT
//       await gameToken.connect(player1).approve(await playGame.getAddress(), stake);
//       await gameToken.connect(player2).approve(await playGame.getAddress(), stake);

//       // Player1 stakes
//       await expect(playGame.connect(player1).stake(matchId))
//         .to.emit(playGame, "Staked")
//         .withArgs(matchId, player1.address, stake);

//       // Player2 stakes
//       await expect(playGame.connect(player2).stake(matchId))
//         .to.emit(playGame, "Staked")
//         .withArgs(matchId, player2.address, stake)
//         .and.to.emit(playGame, "MatchReady")
//         .withArgs(matchId);

//       const match = await playGame.getMatch(matchId);
//       expect(match.status).to.equal(1); // STAKED
//       expect(match.player1Staked).to.be.true;
//       expect(match.player2Staked).to.be.true;
//     });

//     it("Should settle match and pay winner", async function () {
//       const matchId = ethers.keccak256(ethers.toUtf8Bytes("match1"));
//       const stake = ethers.parseEther("10");

//       // Create match and stake
//       await playGame.connect(operator).createMatch(matchId, player1.address, player2.address, stake);

//       await gameToken.connect(player1).approve(await playGame.getAddress(), stake);
//       await gameToken.connect(player2).approve(await playGame.getAddress(), stake);

//       await playGame.connect(player1).stake(matchId);
//       await playGame.connect(player2).stake(matchId);

//       const player1BalanceBefore = await gameToken.balanceOf(player1.address);

//       // Settle match with player1 as winner
//       await expect(playGame.connect(operator).commitResult(matchId, player1.address))
//         .to.emit(playGame, "Settled")
//         .withArgs(matchId, player1.address, stake.mul(2));

//       const player1BalanceAfter = await gameToken.balanceOf(player1.address);
//       expect(player1BalanceAfter.sub(player1BalanceBefore)).to.equal(stake.mul(2));

//       const match = await playGame.getMatch(matchId);
//       expect(match.status).to.equal(2); // SETTLED
//       expect(match.winner).to.equal(player1.address);
//     });

//     it("Should allow refunds after timeout", async function () {
//       const matchId = ethers.keccak256(ethers.toUtf8Bytes("match1"));
//       const stake = ethers.parseEther("10");

//       // Create match and partial stake
//       await playGame.connect(operator).createMatch(matchId, player1.address, player2.address, stake);
//       await gameToken.connect(player1).approve(await playGame.getAddress(), stake);
//       await playGame.connect(player1).stake(matchId);

//       // Fast forward time
//       await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]); // 25 hours
//       await ethers.provider.send("evm_mine");

//       const player1BalanceBefore = await gameToken.balanceOf(player1.address);

//       // Refund
//       await expect(playGame.refund(matchId))
//         .to.emit(playGame, "Refunded")
//         .withArgs(matchId, player1.address, player2.address, stake);

//       const player1BalanceAfter = await gameToken.balanceOf(player1.address);
//       expect(player1BalanceAfter.sub(player1BalanceBefore)).to.equal(stake);

//       const match = await playGame.getMatch(matchId);
//       expect(match.status).to.equal(3); // REFUNDED
//     });

//     it("Should reject non-player stakes", async function () {
//       const matchId = ethers.keccak256(ethers.toUtf8Bytes("match1"));
//       const stake = ethers.parseEther("10");

//       await playGame.connect(operator).createMatch(matchId, player1.address, player2.address, stake);

//       // Give GT to owner and try to stake
//       await gameToken.connect(tokenStore).mint(owner.address, stake);
//       await gameToken.connect(owner).approve(await playGame.getAddress(), stake);

//       await expect(
//         playGame.connect(owner).stake(matchId)
//       ).to.be.revertedWith("Not a player in this match");
//     });

//     it("Should reject double staking", async function () {
//       const matchId = ethers.keccak256(ethers.toUtf8Bytes("match1"));
//       const stake = ethers.parseEther("10");

//       await playGame.connect(operator).createMatch(matchId, player1.address, player2.address, stake);
//       await gameToken.connect(player1).approve(await playGame.getAddress(), stake.mul(2));

//       await playGame.connect(player1).stake(matchId);

//       await expect(
//         playGame.connect(player1).stake(matchId)
//       ).to.be.revertedWith("Player1 already staked");
//     });
//   });

//   describe("Integration Test", function () {
//     it("Should complete full game flow", async function () {
//       // 1. Players buy GT
//       const usdtAmount = ethers.parseUnits("20", 6);

//       await mockUSDT.connect(player1).approve(await tokenStore.getAddress(), usdtAmount);
//       await tokenStore.connect(player1).buy(usdtAmount);

//       await mockUSDT.connect(player2).approve(await tokenStore.getAddress(), usdtAmount);
//       await tokenStore.connect(player2).buy(usdtAmount);

//       // 2. Create match
//       const matchId = ethers.keccak256(ethers.toUtf8Bytes("integration_match"));
//       const stake = ethers.parseEther("15");

//       await playGame.connect(operator).createMatch(matchId, player1.address, player2.address, stake);

//       // 3. Players stake
//       await gameToken.connect(player1).approve(await playGame.getAddress(), stake);
//       await gameToken.connect(player2).approve(await playGame.getAddress(), stake);

//       await playGame.connect(player1).stake(matchId);
//       await play
