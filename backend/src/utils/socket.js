// @ts-check
/**
 * @typedef {import('http').Server} HttpServer
 * @typedef {import('socket.io').Server} SocketIOServer
 */

/** @type {SocketIOServer | undefined} */
let io;

module.exports = {
  /**
   * @param {HttpServer} server
   * @returns {SocketIOServer}
   */
  init: (server) => {
    const { Server } = require('socket.io');
    io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
    });
    return io;
  },
  /**
   * @returns {SocketIOServer}
   */
  getIo: () => {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }
    return io;
  },
};
