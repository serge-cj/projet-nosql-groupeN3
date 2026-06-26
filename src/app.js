require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { logger } = require('./utils/logger');
const config = require('./config');

const app = express();

// ============ Nous configurons les middlewares ============

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

const allowedOrigins = config.frontend.urls;

app.use(
  cors({
    origin: (origin, callback) => {
      // Nous autorisons les requêtes sans origine (ex: curl, appels serveur à serveur)
      if (!origin) return callback(null, true);

      // En développement, nous acceptons toute origine localhost:PORT afin d'éviter les soucis liés aux changements de port
      if (config.server.nodeEnv === 'development') {
        try {
          const parsed = new URL(origin);
          if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
            return callback(null, true);
          }
        } catch (err) {
          // Nous laissons la vérification se poursuivre avec allowedOrigins
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

// ============ Nous déclarons les routes ============

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Nous gérons le cas d'une route introuvable
app.use((req, res) => {
  res.status(404).json({
    error: 'Ressource introuvable',
    path: req.path,
  });
});

// Nous mettons en place ici le gestionnaire d'erreurs global
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
