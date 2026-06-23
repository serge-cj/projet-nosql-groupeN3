const pino = require('pino');
const pinoHttp = require('pino-http');
const config = require('../config');

const baseLogger = pino({
  level: config.logging.level,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      singleLine: false,
    },
  },
});

// Standalone logger (for non-HTTP contexts)
const logger = {
  info: (msg, data = {}) => baseLogger.info(data, msg),
  error: (msg, data = {}) => baseLogger.error(data, msg),
  warn: (msg, data = {}) => baseLogger.warn(data, msg),
  debug: (msg, data = {}) => baseLogger.debug(data, msg),
};

// HTTP logger middleware
const httpLogger = pinoHttp({
  logger: baseLogger,
  autoLogging: true,
});

module.exports = {
  logger,
  httpLogger,
};
