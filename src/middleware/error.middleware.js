import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/response.js';

export function errorMiddleware(err, _req, res, _next) {
  let status = err instanceof ApiError ? err.status : 500;
  let message = err instanceof ApiError ? err.message : 'Internal server error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = err.message;
  }

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier';
  }

  if (err.code === 11000) {
    status = 409;
    const duplicateField = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `${duplicateField} already exists`;
  }

  logger.error(message, { status, stack: err.stack });
  return res.status(status).json({ success: false, message });
}
