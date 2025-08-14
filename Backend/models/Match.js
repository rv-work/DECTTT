// models/Match.js
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  player1: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  player2: {
    type: String,
    default: null,
    lowercase: true,
    index: true
  },
  stakeAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'cancelled', 'blockchain_settled'],
    default: 'waiting',
    index: true
  },
  gameState: {
    type: String,
    enum: ['waiting', 'ongoing', 'finished', 'tie', 'cancelled'],
    default: 'waiting'
  },
  board: {
    type: [String],
    default: ['', '', '', '', '', '', '', '', '']
  },
  currentPlayer: {
    type: String,
    lowercase: true
  },
  winner: {
    type: String,
    default: null,
    lowercase: true
  },
  moveCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  lastMoveAt: {
    type: Date,
    default: null
  },
  blockchainTxHash: {
    type: String,
    default: null
  },
  blockchainSettledAt: {
    type: Date,
    default: null
  }
});

// Indexes for better query performance
matchSchema.index({ player1: 1, createdAt: -1 });
matchSchema.index({ player2: 1, createdAt: -1 });
matchSchema.index({ status: 1, createdAt: -1 });
matchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Match', matchSchema);
