import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";

const Navbar = () => {
  const { account, balances, connectWallet, loading } = useWeb3();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 shadow-lg border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="text-2xl font-bold text-white hover:text-purple-300 transition-colors"
            >
              🎮 TicTacToe DApp
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-purple-600/50"
              }`}
            >
              Home
            </Link>
            <Link
              to="/buy"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/buy")
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-purple-600/50"
              }`}
            >
              Buy Tokens
            </Link>
            <Link
              to="/play"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/play")
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-purple-600/50"
              }`}
            >
              Play Game
            </Link>
            <Link
              to="/leaderboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/leaderboard")
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-purple-600/50"
              }`}
            >
              Leaderboard
            </Link>
          </div>

          {/* Wallet Section */}
          <div className="flex items-center space-x-4">
            {account ? (
              <div className="flex items-center space-x-4">
                {/* Balance Display */}
                <div className="bg-black/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-yellow-400">
                      <span className="font-semibold">USDT:</span>{" "}
                      {parseFloat(balances.usdt).toFixed(2)}
                    </div>
                    <div className="text-green-400">
                      <span className="font-semibold">GT:</span>{" "}
                      {parseFloat(balances.gt).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Account Address */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg px-4 py-2 text-white font-medium">
                  {truncateAddress(account)}
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                         text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 
                         transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  "Connect Wallet"
                )}
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-300 hover:text-white">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-purple-800/50 backdrop-blur-sm">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/")
                ? "bg-purple-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-purple-600/50"
            }`}
          >
            Home
          </Link>
          <Link
            to="/buy"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/buy")
                ? "bg-purple-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-purple-600/50"
            }`}
          >
            Buy Tokens
          </Link>
          <Link
            to="/play"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/play")
                ? "bg-purple-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-purple-600/50"
            }`}
          >
            Play Game
          </Link>
          <Link
            to="/leaderboard"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/leaderboard")
                ? "bg-purple-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-purple-600/50"
            }`}
          >
            Leaderboard
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
