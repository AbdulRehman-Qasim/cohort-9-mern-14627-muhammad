import dotenv from 'dotenv';
dotenv.config();

import app from './src/app';
import logger from './src/utils/logger';
import socketUtil from './src/utils/socket';
import prisma from './src/config/prisma';
import { verifyToken } from './src/utils/jwt';
const cookie = require('cookie');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

const io = socketUtil.init(server);

// Middleware for Socket.IO authentication
io.use((socketConn, next) => {
  try {
    const cookies = socketConn.request.headers.cookie;
    if (!cookies) {
      return next(new Error('Authentication error: No cookies'));
    }

    const parsedCookies = cookie.parse(cookies);
    const token = parsedCookies.jwt;

    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }

    const decoded = (verifyToken(token) as unknown) as { id: string };
    
    // Attach the verified user ID to the socket
    socketConn.data.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socketConn) => {
  const userId = socketConn.data.user?.id;
  if (userId) {
    socketConn.join(userId);
  }
});

let isShuttingDown = false;

const gracefulShutdown = (signal: string, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`${signal} signal received: closing HTTP server`);

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000).unref();

  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await prisma.$disconnect();
      logger.info('Prisma database connection closed');
    } catch (dbErr: any) {
      logger.error(`Error closing Prisma database connection: ${dbErr.message}`);
    }
    process.exit(exitCode);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  gracefulShutdown('unhandledRejection', 1);
});