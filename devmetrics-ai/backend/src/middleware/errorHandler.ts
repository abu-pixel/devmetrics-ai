import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.flatten().fieldErrors,
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid or malformed token',
      ...(isDevelopment && { message: err.message }),
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Log the error for monitoring
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    message: err.message,
    statusCode: err.statusCode,
    stack: isDevelopment ? err.stack : undefined,
  });

  const statusCode = err.statusCode || 500;
  const response: Record<string, unknown> = {
    error: err.message || 'Internal server error',
  };

  if (isDevelopment) {
    response.stack = err.stack;
    response.details = err.details;
  }

  res.status(statusCode).json(response);
}
