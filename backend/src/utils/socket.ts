import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server | undefined;

export = {
  init: (server: HttpServer): Server => {
    io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
      }
    });
    return io;
  },
  getIo: (): Server => {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }
    return io;
  }
};