const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'API is running' });
});

// Global Exception Handler
app.use(errorHandler);

module.exports = app;
