const mongoose = require("mongoose")
// models/Player.js
const playerSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  nickname: {
    type: String,
    default: null,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: null
  },
  totalMatches: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWins: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },
  totalLosses: {
    type: Number,
    default: 0,
    min: 0
  },
  totalTies: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  bestStreak: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Virtual field for win rate
playerSchema.virtual('winRate').get(function() {
  const totalGames = this.totalWins + this.totalLosses + this.totalTies;
  if (totalGames === 0) return 0;
  return (this.totalWins / totalGames) * 100;
});

// Indexes for leaderboard queries
playerSchema.index({ totalEarnings: -1, totalWins: -1 });
playerSchema.index({ totalWins: -1, totalEarnings: -1 });
playerSchema.index({ lastActive: -1 });

module.exports = mongoose.model('Player', playerSchema);
