const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const matchRoutes = require('./routes/matches');
const gameRoutes = require('./routes/game');
const playerRoutes = require('./routes/players');
const leaderboardRoutes = require('./routes/leaderboard');
const statsRoutes = require('./routes/stats');

// Import controllers
const gameController = require('./controllers/gameController');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tictactoe';

// Store user socket mappings
const userSockets = new Map(); // userId -> socketId
const socketUsers = new Map(); // socketId -> userId

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Join user-specific room for notifications
  socket.on('joinUserRoom', (userId) => {
    console.log(`🏠 User ${userId} joined their room`);
    socket.join(`user_${userId.toLowerCase()}`);
    userSockets.set(userId.toLowerCase(), socket.id);
    socketUsers.set(socket.id, userId.toLowerCase());
  });

  // Join match room
  socket.on('joinMatch', (matchId) => {
    socket.join(matchId);
    console.log(`🎮 Player ${socket.id} joined match ${matchId}`);
    
    // Notify room about player joining
    socket.to(matchId).emit('playerJoinedRoom', {
      playerId: socketUsers.get(socket.id),
      matchId
    });
  });

  // Leave match room
  socket.on('leaveMatch', (matchId) => {
    socket.leave(matchId);
    console.log(`🚪 Player ${socket.id} left match ${matchId}`);
    
    socket.to(matchId).emit('playerLeftRoom', {
      playerId: socketUsers.get(socket.id),
      matchId
    });
  });

  // Handle game moves
  socket.on('makeMove', async (data) => {
    try {
      const result = await gameController.handleMove(data);
      if (result.success) {
        console.log(`🎯 Move made in match ${data.matchId}`);
        
        // Broadcast move to all players in the match except sender
        socket.to(data.matchId).emit('opponentMove', {
          position: data.position,
          player: data.player,
          board: result.board,
          gameState: result.gameState,
          currentPlayer: result.currentPlayer
        });

        // If game ended, notify both players
        if (result.gameState !== 'ongoing') {
          io.to(data.matchId).emit('gameEnded', {
            winner: result.winner,
            gameState: result.gameState,
            finalBoard: result.board
          });
        }
      } else {
        socket.emit('moveError', { message: result.message });
      }
    } catch (error) {
      console.error('Error handling move:', error);
      socket.emit('moveError', { message: 'Internal server error' });
    }
  });

  // Handle match notifications
  socket.on('notifyMatchJoined', (data) => {
    const { player1, matchData } = data;
    
    // Notify the match creator that someone joined
    io.to(`user_${player1.toLowerCase()}`).emit('matchJoined', {
      ...matchData,
      message: 'Someone joined your match!'
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
    
    const userId = socketUsers.get(socket.id);
    if (userId) {
      userSockets.delete(userId);
      socketUsers.delete(socket.id);
    }
  });
});

// Helper function to notify users
const notifyUser = (userId, event, data) => {
  const socketId = userSockets.get(userId.toLowerCase());
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

// Make io and helper functions accessible to routes
app.set('socketio', io);
app.set('notifyUser', notifyUser);
app.set('userSockets', userSockets);

// Routes
app.use('/api/matches', matchRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connectedUsers: userSockets.size
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
});

module.exports = { app, io };