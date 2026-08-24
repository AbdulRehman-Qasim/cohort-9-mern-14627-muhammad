// @ts-check
require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/utils/logger');
const socketUtil = require('./src/utils/socket');
const prisma = require('./src/config/prisma');
const { verifyToken } = require('./src/utils/jwt');
const { parse } = /** @type {any} */ (require('cookie'));

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

    const parsedCookies = parse(cookies);
    const token = parsedCookies.jwt;

    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }

    /** @type {{ id: string }} */
    const decoded = /** @type {any} */ (verifyToken(token));

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

/**
 * @param {string} signal
 * @param {number} [exitCode=0]
 */
const gracefulShutdown = (signal, exitCode = 0) => {
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
    } catch (/** @type {any} */ dbErr) {
      logger.error(`Error closing Prisma database connection: ${dbErr.message}`);
    }
    process.exit(exitCode);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (/** @type {Error} */ err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  gracefulShutdown('unhandledRejection', 1);
});
