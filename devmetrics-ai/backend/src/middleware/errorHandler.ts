import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.flatten().fieldErrors,
    });
  }

  console.error(err);
  const statusCode = (err as { statusCode?: number }).statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
  });
}
