import type { Request, Response, NextFunction } from "express";
import { logger } from "../../shared/utils/logger";

/**
 * Global Error Handler Middleware
 * Centralized error handling and logging
 */

export function errorHandler(
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  logger.error(`Error in ${req.method} ${req.path}:`, err);

  // Don't log password or sensitive data
  const sanitizedBody = { ...req.body };
  if (sanitizedBody.password) {
    sanitizedBody.password = '[REDACTED]';
  }

  logger.debug('Request body:', sanitizedBody);

  // Send appropriate error response
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}