let io;
module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
      }
    });
    return io;
  },
  getIo: () => {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }
    return io;
  }
};