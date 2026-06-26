class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }

  // Nous définissons ici des méthodes statiques pour les erreurs courantes
  static badRequest(message, details = null) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message, details = null) {
    return new AppError(message, 401, 'UNAUTHORIZED', details);
  }

  static forbidden(message, details = null) {
    return new AppError(message, 403, 'FORBIDDEN', details);
  }

  static notFound(message, details = null) {
    return new AppError(message, 404, 'NOT_FOUND', details);
  }

  static conflict(message, details = null) {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static internal(message, details = null) {
    return new AppError(message, 500, 'INTERNAL_ERROR', details);
  }
}

module.exports = AppError;
