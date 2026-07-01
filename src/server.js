require('dotenv').config();
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { logger } = require('./utils/logger');
const config = require('./config');
const app = require('./app');
const { initializeSocket } = require('./socket');
const http = require('http');

(async () => {
  try {
    await connectDatabase();
    await connectRedis();

    const port = config.server.port;
    const server = http.createServer(app);
    
    // Nous initialisons Socket.io
    await initializeSocket(server);

    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        logger.error('Erreur serveur', { message: error.message, stack: error.stack });
        throw error;
      }

      const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use. Use a different port with PORT=xxxx`);
          process.exit(1);
          break;
        default:
          logger.error('Erreur serveur', { code: error.code, message: error.message, stack: error.stack });
          process.exit(1);
      }
    });

    server.listen(port, () => {
      logger.info(`\n Serveur Libreville Eats démarré`);
      logger.info(` Port : ${port}`);
      logger.info(` URL API : ${config.server.apiBaseUrl}`);
      logger.info(` MongoDB : ${config.mongodb.uri.replace(/:[^@]*@/, ':****@')}`);
      logger.info(`  Environnement : ${config.server.nodeEnv}`);
      logger.info(` WebSocket : Socket.io activé`);
      logger.info(`\n Le serveur accepte les requêtes\n`);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM reçu, arrêt en cours...');
      server.close(() => {
        logger.info('Serveur arrêté');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT reçu, arrêt en cours...');
      server.close(() => {
        logger.info('Serveur arrêté');
        process.exit(0);
      });
    });
  } catch (err) {
    logger.error('Échec du démarrage du serveur', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
})();

module.exports = app;
