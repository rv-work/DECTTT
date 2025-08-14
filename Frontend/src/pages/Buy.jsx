import React, { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import toast from "react-hot-toast";

const Buy = () => {
  const { account, balances, mintUSDT, buyGT, loading } = useWeb3();
  const [usdtAmount, setUsdtAmount] = useState("");
  const [gtAmount, setGtAmount] = useState("");
  // const [activeTab, setActiveTab] = useState("mint"); // 'mint' or 'buy'

  const handleMintUSDT = async (e) => {
    e.preventDefault();
    if (!usdtAmount || parseFloat(usdtAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    await mintUSDT(usdtAmount);
    setUsdtAmount("");
  };

  const handleBuyGT = async (e) => {
    e.preventDefault();
    if (!gtAmount || parseFloat(gtAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (parseFloat(balances.usdt) < parseFloat(gtAmount)) {
      toast.error("Insufficient USDT balance");
      return;
    }
    await buyGT(gtAmount);
    setGtAmount("");
  };

  const StepCard = ({ number, title, description, completed }) => (
    <div
      className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
        completed
          ? "border-green-500 bg-green-500/10"
          : "border-gray-600 bg-gray-800/50"
      }`}
    >
      <div
        className={`absolute -top-4 -left-4 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
          completed ? "bg-green-500 text-white" : "bg-gray-600 text-gray-300"
        }`}
      >
        {completed ? "✓" : number}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  );

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-300 mb-8">
            Please connect your wallet to buy tokens
          </p>
          <div className="text-6xl">🔗</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Buy{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Tokens
            </span>
          </h1>
          <p className="text-xl text-gray-300">
            Get USDT and GT tokens to start playing
          </p>
        </div>

        {/* Current Balance */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/10">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Your Current Balance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 rounded-xl text-center">
              <div className="text-3xl mb-2">💵</div>
              <h3 className="text-lg font-semibold text-white">USDT Balance</h3>
              <p className="text-2xl font-bold text-white">
                {parseFloat(balances.usdt).toFixed(2)} USDT
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 rounded-xl text-center">
              <div className="text-3xl mb-2">🎮</div>
              <h3 className="text-lg font-semibold text-white">GT Balance</h3>
              <p className="text-2xl font-bold text-white">
                {parseFloat(balances.gt).toFixed(2)} GT
              </p>
            </div>
          </div>
        </div>

        {/* Steps Guide */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            How to Get Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              number="1"
              title="Mint USDT"
              description="Get test USDT tokens for free"
              completed={parseFloat(balances.usdt) > 0}
            />
            <StepCard
              number="2"
              title="Buy GT Tokens"
              description="Exchange USDT for GT at 1:1 ratio"
              completed={parseFloat(balances.gt) > 0}
            />
            <StepCard
              number="3"
              title="Start Playing"
              description="Use GT tokens to stake in matches"
              completed={parseFloat(balances.gt) > 0}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mint USDT Card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💵</div>
              <h2 className="text-2xl font-bold text-white mb-2">Mint USDT</h2>
              <p className="text-gray-300">
                Get free test USDT tokens (Sepolia network)
              </p>
            </div>

            <form onSubmit={handleMintUSDT} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  USDT Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={usdtAmount}
                    onChange={(e) => setUsdtAmount(e.target.value)}
                    placeholder="Enter USDT amount"
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-3 text-white 
                             placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                  <div className="absolute right-3 top-3 text-gray-400 font-medium">
                    USDT
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Network:</span>
                  <span className="text-green-400">Sepolia Testnet</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Cost:</span>
                  <span className="text-green-400">Free (Test tokens)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !usdtAmount}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 
                         text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 
                         transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Minting...</span>
                  </div>
                ) : (
                  "Mint USDT Tokens"
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <p className="text-blue-200 text-sm">
                💡 <strong>Tip:</strong> This mints test USDT tokens on Sepolia
                testnet. You can mint as many as you need for testing.
              </p>
            </div>
          </div>

          {/* Buy GT Card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Buy GT Tokens
              </h2>
              <p className="text-gray-300">
                Exchange USDT for GT tokens (1:1 ratio)
              </p>
            </div>

            <form onSubmit={handleBuyGT} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  USDT to Spend
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={balances.usdt}
                    value={gtAmount}
                    onChange={(e) => setGtAmount(e.target.value)}
                    placeholder="Enter USDT amount to spend"
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-3 text-white 
                             placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                  <div className="absolute right-3 top-3 text-gray-400 font-medium">
                    USDT
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-400">
                    Available: {parseFloat(balances.usdt).toFixed(2)} USDT
                  </span>
                  <button
                    type="button"
                    onClick={() => setGtAmount(balances.usdt)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Use Max
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Exchange Rate:</span>
                  <span className="text-green-400">1 USDT = 1 GT</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>You will receive:</span>
                  <span className="text-green-400">
                    {gtAmount ? parseFloat(gtAmount).toFixed(2) : "0"} GT
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Network Fee:</span>
                  <span className="text-green-400">Gas only</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !gtAmount ||
                  parseFloat(balances.usdt) < parseFloat(gtAmount || 0)
                }
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 
                         text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 
                         transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Buying...</span>
                  </div>
                ) : (
                  "Buy GT Tokens"
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-green-500/20 rounded-lg border border-green-500/30">
              <p className="text-green-200 text-sm">
                🎯 <strong>Game Tokens:</strong> GT tokens are used to stake in
                matches. Win games to earn more GT tokens!
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {parseFloat(balances.gt) > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30">
              <h3 className="text-2xl font-bold text-white mb-4">
                🎉 You're Ready to Play!
              </h3>
              <p className="text-gray-300 mb-6">
                You have{" "}
                <span className="text-green-400 font-bold">
                  {parseFloat(balances.gt).toFixed(2)} GT
                </span>{" "}
                tokens. Start playing matches now!
              </p>
              <a
                href="/play"
                className="inline-block bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 
                         text-white font-bold py-3 px-8 rounded-xl text-lg transition-all duration-200 
                         transform hover:scale-105 shadow-xl"
              >
                Start Playing 🎮
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Buy;
