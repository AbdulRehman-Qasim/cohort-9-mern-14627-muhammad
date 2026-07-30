require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
let isShuttingDown = false;

const gracefulShutdown = (signal, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} signal received: closing HTTP server`);

  // Force shutdown after 10 seconds if connections don't close naturally
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000).unref();

  server.close(async () => {
    logger.info('HTTP server closed');

    // Disconnect Prisma gracefully
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

// Handle unhandled promise rejections safely
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  gracefulShutdown('unhandledRejection', 1);
});
