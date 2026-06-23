require('dotenv').config();

module.exports = {
  // Base de données
  mongodb: {
    local: process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/libreville_eats',
    atlas: process.env.MONGODB_ATLAS_URI || '',
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/libreville_eats',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
  },

  // Serveur
  server: {
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
  },

  // JWT
  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
      }
      return secret;
    })(),
    expire: process.env.JWT_EXPIRE || '7d',
  },

  // Frontend
  frontend: {
    // Default to the Next.js dev server on 3000 (used by the frontend in this repo)
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
    urls: (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:3001')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  },

  // Journalisation
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
