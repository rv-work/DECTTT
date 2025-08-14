const mongoose = require("mongoose")
// models/GameMove.js
const gameMoveSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    index: true
  },
  player: {
    type: String,
    required: true,
    lowercase: true
  },
  position: {
    type: Number,
    required: true,
    min: 0,
    max: 8
  },
  symbol: {
    type: String,
    required: true,
    enum: ['X', 'O']
  },
  moveNumber: {
    type: Number,
    required: true,
    min: 1
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
gameMoveSchema.index({ matchId: 1, moveNumber: 1 });
gameMoveSchema.index({ matchId: 1, timestamp: 1 });

module.exports = mongoose.model('GameMove', gameMoveSchema);