import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import Game from "../ABIs/GameTokenABI.json";
import MockUSDT from "../ABIs/MockUSDTABI.json";
import PlayGame from "../ABIs/PlayGameABI.json";
import TokenStore from "../ABIs/TokenStoreABI.json";

const Web3Context = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

// Contract addresses
const CONTRACT_ADDRESSES = {
  GameToken: "0x66F46D274A186DCd1E13e8ad598184b20910FC69",
  MockUSDT: "0x6BABe4703b06fa62602Fe4e470fde43DdbdE66b0",
  PlayGame: "0xdb17725A2353F5da589294A4b965Ccb41715AA0C",
  TokenStore: "0x5E581B8C44F0ec1f86b68A1E23342432311e6e15",
};

const GAME_TOKEN_ABI = Game;

const MOCK_USDT_ABI = MockUSDT;

const TOKEN_STORE_ABI = TokenStore;

const PLAY_GAME_ABI = PlayGame;

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contracts, setContracts] = useState({});
  const [balances, setBalances] = useState({
    usdt: "0",
    gt: "0",
  });
  const [loading, setLoading] = useState(false);

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast.error("Please install MetaMask!");
        return;
      }

      setLoading(true);
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = await web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);

      // Initialize contracts
      initializeContracts(web3Signer);

      toast.success("Wallet connected successfully!");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  // Initialize contracts
  const initializeContracts = (signer) => {
    const gameToken = new ethers.Contract(
      CONTRACT_ADDRESSES.GameToken,
      GAME_TOKEN_ABI,
      signer
    );
    const mockUSDT = new ethers.Contract(
      CONTRACT_ADDRESSES.MockUSDT,
      MOCK_USDT_ABI,
      signer
    );
    const tokenStore = new ethers.Contract(
      CONTRACT_ADDRESSES.TokenStore,
      TOKEN_STORE_ABI,
      signer
    );
    const playGame = new ethers.Contract(
      CONTRACT_ADDRESSES.PlayGame,
      PLAY_GAME_ABI,
      signer
    );

    setContracts({
      gameToken,
      mockUSDT,
      tokenStore,
      playGame,
    });
  };

  // Get balances
  const getBalances = async () => {
    if (!account || !contracts.gameToken || !contracts.mockUSDT) return;

    try {
      const [usdtBalance, gtBalance] = await Promise.all([
        contracts.mockUSDT.balanceOf(account),
        contracts.gameToken.balanceOf(account),
      ]);

      setBalances({
        usdt: ethers.formatUnits(usdtBalance, 6), // USDT has 6 decimals
        gt: ethers.formatUnits(gtBalance, 18), // GT has 18 decimals
      });
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  // Mint USDT
  const mintUSDT = async (amount) => {
    if (!contracts.mockUSDT) return;

    try {
      setLoading(true);
      const tx = await contracts.mockUSDT.mintToSelf(
        ethers.parseUnits(amount, 6)
      );
      await tx.wait();
      toast.success("USDT minted successfully!");
      await getBalances();
    } catch (error) {
      console.error("Error minting USDT:", error);
      toast.error("Failed to mint USDT");
    } finally {
      setLoading(false);
    }
  };

  // Buy GT tokens
  const buyGT = async (usdtAmount) => {
    if (!contracts.mockUSDT || !contracts.tokenStore) return;

    try {
      setLoading(true);

      // First approve USDT
      const approvalTx = await contracts.mockUSDT.approve(
        CONTRACT_ADDRESSES.TokenStore,
        ethers.parseUnits(usdtAmount, 6)
      );
      await approvalTx.wait();

      // Then buy GT
      const buyTx = await contracts.tokenStore.buy(
        ethers.parseUnits(usdtAmount, 6)
      );
      await buyTx.wait();

      toast.success("GT tokens purchased successfully!");
      await getBalances();
    } catch (error) {
      console.error("Error buying GT:", error);
      toast.error("Failed to buy GT tokens");
    } finally {
      setLoading(false);
    }
  };

  // Create match
  const createMatch = async (stakeAmount) => {
    if (!contracts.playGame) return;

    try {
      setLoading(true);
      const matchId = ethers.keccak256(
        ethers.toUtf8Bytes(`match_${Date.now()}_${account}`)
      );

      // Create match via backend API first
      const response = await fetch("http://localhost:5000/api/matches/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player1: account,
          stakeAmount: ethers.parseUnits(stakeAmount, 18).toString(),
          matchId,
        }),
      });

      if (response.ok) {
        toast.success("Match created successfully!");
        return matchId;
      }
    } catch (error) {
      console.error("Error creating match:", error);
      toast.error("Failed to create match");
    } finally {
      setLoading(false);
    }
  };

  // Join match and place stake
  const joinMatch = async (matchId, stakeAmount) => {
    if (!contracts.gameToken || !contracts.playGame) return;

    try {
      setLoading(true);

      // First approve GT tokens
      const approvalTx = await contracts.gameToken.approve(
        CONTRACT_ADDRESSES.PlayGame,
        ethers.parseUnits(stakeAmount, 18)
      );
      await approvalTx.wait();

      // Then place stake
      const stakeTx = await contracts.playGame.placeStake(matchId);
      await stakeTx.wait();

      toast.success("Joined match successfully!");
    } catch (error) {
      console.error("Error joining match:", error);
      toast.error("Failed to join match");
    } finally {
      setLoading(false);
    }
  };

  // Check if wallet is connected on page load
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update balances when account changes
  useEffect(() => {
    if (account && contracts.gameToken) {
      getBalances();
      const interval = setInterval(getBalances, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, contracts]);

  const value = {
    provider,
    signer,
    account,
    contracts,
    balances,
    loading,
    connectWallet,
    mintUSDT,
    buyGT,
    createMatch,
    joinMatch,
    getBalances,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
