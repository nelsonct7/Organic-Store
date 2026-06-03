/**
 * Custom AppError class that extends the native Error class
 * Used for consistent error handling throughout the application
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - typically 400 Bad Request
 */
class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

/**
 * Authentication Error - typically 401 Unauthorized
 */
class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

/**
 * Authorization Error - typically 403 Forbidden
 */
class AuthorizationError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403);
    this.name = "AuthorizationError";
  }
}

/**
 * Not Found Error - typically 404 Not Found
 */
class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

/**
 * Conflict Error - typically 409 Conflict
 */
class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409);
    this.name = "ConflictError";
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
};