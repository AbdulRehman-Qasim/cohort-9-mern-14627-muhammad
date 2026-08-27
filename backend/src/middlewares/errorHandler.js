const logger = require('../utils/logger');
const { Prisma } = require('@prisma/client');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(err);

  let statusCode = Number.parseInt(err.statusCode, 10) || 500;
  if (Number.isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
    statusCode = 500;
  }

  let message = err.message || 'Internal Server Error';

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    message = 'Database request error';
    if (err.code === 'P2002') {
      message = 'Unique constraint failed on the database';
    } else if (err.code === 'P2024') {
      statusCode = 503;
      message = 'Service Unavailable';
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Database validation error';
  }

  // In production, never expose internal server error messages
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