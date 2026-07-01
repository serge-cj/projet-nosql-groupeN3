const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { logger } = require('../utils/logger');
const { getRedisClient, isRedisConnected } = require('../config/redis');

let io = null;

/**
 * Nous initialisons le serveur Socket.io.
 * @param {Object} httpServer - Serveur HTTP Express
 * @returns {Object} - Instance Socket.io
 */
async function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Nous utilisons l'adaptateur Redis lorsqu'il est disponible afin de permettre la mise à l'échelle horizontale.
  // Les clients dupliqués ne sont pas connectés automatiquement : sans connect(), le premier publish
  // échoue (ou réussit une fois puis casse), ce qui faisait planter tout le process Node au moindre
  // émission Socket.io suivante. Nous repassons sur l'adaptateur mémoire en cas d'échec.
  if (isRedisConnected()) {
    try {
      const redisClient = getRedisClient();
      const pubClient = redisClient.duplicate();
      const subClient = redisClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);

      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.io Redis adapter configuré');
    } catch (err) {
      logger.error('Échec de configuration de l’adaptateur Redis pour Socket.io, utilisation de l’adaptateur mémoire', {
        message: err.message,
      });
    }
  }

  // Nous définissons ici le middleware d'authentification Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Token manquant'));
      }

      const { verifyToken } = require('../utils/token');
      const decoded = verifyToken(token);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      logger.error('Erreur authentification Socket.io', { message: err.message });
      next(new Error('Authentification échouée'));
    }
  });

  // Nous gérons ici les connexions entrantes
  io.on('connection', (socket) => {
    logger.info('Client Socket.io connecté', { socketId: socket.id, userId: socket.userId });

    // Nous faisons rejoindre la room de l'utilisateur
    socket.join(`user:${socket.userId}`);

    // Nous traitons l'événement de rejointe d'une room de commande
    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
      logger.info('Client rejoint room commande', { socketId: socket.id, orderId });
    });

    // Nous traitons l'événement de sortie d'une room de commande
    socket.on('leave:order', (orderId) => {
      socket.leave(`order:${orderId}`);
      logger.info('Client quitte room commande', { socketId: socket.id, orderId });
    });

    // Nous traitons l'événement de mise à jour de la position GPS du livreur
    socket.on('location:update', (data) => {
      const { orderId, lat, lng } = data;
      logger.debug('Position GPS mise à jour', { socketId: socket.id, orderId, lat, lng });

      // Nous émettons la position aux clients présents dans la room de la commande
      io.to(`order:${orderId}`).emit('location:updated', {
        orderId,
        lat,
        lng,
        timestamp: new Date(),
      });
    });

    // Nous traitons l'événement de mise à jour du statut de commande
    socket.on('order:status:update', (data) => {
      const { orderId, status } = data;
      logger.debug('Statut commande mis à jour', { socketId: socket.id, orderId, status });

      // Nous émettons le nouveau statut aux clients présents dans la room de la commande
      io.to(`order:${orderId}`).emit('order:status:updated', {
        orderId,
        status,
        timestamp: new Date(),
      });
    });

    // Nous traitons l'événement de déconnexion
    socket.on('disconnect', () => {
      logger.info('Client Socket.io déconnecté', { socketId: socket.id, userId: socket.userId });
    });
  });

  logger.info('Socket.io initialisé');
  return io;
}

/**
 * Nous envoyons un événement à une room spécifique.
 * @param {string} room - Nom de la room
 * @param {string} event - Nom de l'événement
 * @param {Object} data - Données à envoyer
 */
function emitToRoom(room, event, data) {
  if (!io) {
    if (process.env.NODE_ENV !== 'test') {
      logger.warn('Socket.io non initialisé');
    }
    return;
  }

  io.to(room).emit(event, data);
  logger.debug('Événement envoyé à room', { room, event });
}

/**
 * Nous envoyons un événement à un utilisateur spécifique.
 * @param {string} userId - ID de l'utilisateur
 * @param {string} event - Nom de l'événement
 * @param {Object} data - Données à envoyer
 */
function emitToUser(userId, event, data) {
  if (!io) {
    if (process.env.NODE_ENV !== 'test') {
      logger.warn('Socket.io non initialisé');
    }
    return;
  }

  io.to(`user:${userId}`).emit(event, data);
  logger.debug('Événement envoyé à utilisateur', { userId, event });
}

/**
 * Nous récupérons l'instance Socket.io.
 * @returns {Object|null} - Instance Socket.io ou null
 */
function getIO() {
  return io;
}

module.exports = {
  initializeSocket,
  emitToRoom,
  emitToUser,
  getIO,
};
