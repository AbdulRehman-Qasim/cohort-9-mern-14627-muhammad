require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/utils/logger');
const socket = require('./src/utils/socket');
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
const io = socket.init(server);
io.on('connection', (socketConn) => {
  const userId = socketConn.handshake.query.userId;
  if (userId) {
    socketConn.join(userId);
  }
});
let isShuttingDown = false;
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
      const prisma = require('./src/config/prisma');
      await prisma.$disconnect();
      logger.info('Prisma database connection closed');
    } catch (dbErr) {
      logger.error(`Error closing Prisma database connection: ${dbErr.message}`);
    }
    process.exit(exitCode);
  });
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  gracefulShutdown('unhandledRejection', 1);
});