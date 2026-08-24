const logger = require('../utils/logger');
const errorHandler = (err, req, res, next) => {
  logger.error(err);
  let statusCode = parseInt(err.statusCode, 10);
  if (Number.isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
    statusCode = 500;
  }
  let message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'Internal Server Error';
  }
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
module.exports = errorHandler;