const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth.routes');
const notesRoutes = require('./routes/notes.routes');
const app = express();
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    if (!origin || origin !== allowedOrigin) {
      return res.status(403).json({ success: false, error: 'Invalid request origin' });
    }
  }
  next();
});
app.use(pinoHttp({ logger }));
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'API is running' });
});
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});
app.use(errorHandler);
module.exports = app;