require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { logger } = require('./utils/logger');
const config = require('./config');

const app = express();

// ============ Middleware ============

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

const allowedOrigins = config.frontend.urls;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., curl, server-side)
      if (!origin) return callback(null, true);

      // In development accept any localhost:PORT origin to avoid flaky dev-port shifts
      if (config.server.nodeEnv === 'development') {
        try {
          const parsed = new URL(origin);
          if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
            return callback(null, true);
          }
        } catch (err) {
          // fall through to allowedOrigins check
        }
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ Routes ============

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Route introuvable
app.use((req, res) => {
  res.status(404).json({
    error: 'Ressource introuvable',
    path: req.path,
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  logger.error('Erreur non gérée', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(err.statusCode || 500).json({
    error: err.message || 'Erreur interne du serveur',
    ...(config.server.nodeEnv === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
