import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error for debugging
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    ({ statusCode, message, code } = handlePrismaError(error));
  }
  // Handle Prisma validation errors
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
    code = 'VALIDATION_ERROR';
  }
  // Handle Prisma initialization errors
  else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 500;
    message = 'Database connection failed';
    code = 'DATABASE_ERROR';
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'AUTH_TOKEN_INVALID';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    code = 'AUTH_TOKEN_EXPIRED';
  }
  // Handle validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
  }
  // Handle file upload errors
  else if (error.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload failed';
    code = 'FILE_UPLOAD_ERROR';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
    code = 'INTERNAL_ERROR';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error,
    }),
  });
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
  code: string;
} {
  switch (error.code) {
    case 'P2002':
      // Unique constraint failed
      return {
        statusCode: 409,
        message: 'A record with this data already exists',
        code: 'DUPLICATE_ENTRY',
      };

    case 'P2014':
      // Required relation missing
      return {
        statusCode: 400,
        message: 'The change you are trying to make would violate the required relation',
        code: 'REQUIRED_RELATION_VIOLATION',
      };

    case 'P2003':
      // Foreign key constraint failed
      return {
        statusCode: 400,
        message: 'Foreign key constraint failed on the field',
        code: 'FOREIGN_KEY_VIOLATION',
      };

    case 'P2025':
      // Record not found
      return {
        statusCode: 404,
        message: 'Record not found',
        code: 'RECORD_NOT_FOUND',
      };

    case 'P2016':
      // Query interpretation error
      return {
        statusCode: 400,
        message: 'Query interpretation error',
        code: 'QUERY_INTERPRETATION_ERROR',
      };

    case 'P2017':
      // Records not connected
      return {
        statusCode: 400,
        message: 'The records for relation are not connected',
        code: 'RECORDS_NOT_CONNECTED',
      };

    case 'P2018':
      // Required connected records not found
      return {
        statusCode: 400,
        message: 'The required connected records were not found',
        code: 'REQUIRED_CONNECTED_RECORDS_NOT_FOUND',
      };

    case 'P2019':
      // Input error
      return {
        statusCode: 400,
        message: 'Input error',
        code: 'INPUT_ERROR',
      };

    case 'P2020':
      // Value out of range for the type
      return {
        statusCode: 400,
        message: 'Value out of range for the type',
        code: 'VALUE_OUT_OF_RANGE',
      };

    case 'P2021':
      // Table does not exist
      return {
        statusCode: 500,
        message: 'The table does not exist in the current database',
        code: 'TABLE_NOT_EXISTS',
      };

    case 'P2022':
      // Column does not exist
      return {
        statusCode: 500,
        message: 'The column does not exist in the current database',
        code: 'COLUMN_NOT_EXISTS',
      };

    case 'P2023':
      // Inconsistent column data
      return {
        statusCode: 500,
        message: 'Inconsistent column data',
        code: 'INCONSISTENT_COLUMN_DATA',
      };

    case 'P2024':
      // Timed out fetching a new connection from the connection pool
      return {
        statusCode: 500,
        message: 'Database connection timeout',
        code: 'DATABASE_CONNECTION_TIMEOUT',
      };

    case 'P2026':
      // The current database provider doesn't support a feature
      return {
        statusCode: 500,
        message: 'The current database provider doesn\'t support a feature that the query used',
        code: 'UNSUPPORTED_FEATURE',
      };

    case 'P2027':
      // Multiple errors occurred during query execution
      return {
        statusCode: 500,
        message: 'Multiple errors occurred on the database during query execution',
        code: 'MULTIPLE_DATABASE_ERRORS',
      };

    default:
      return {
        statusCode: 500,
        message: 'Database operation failed',
        code: 'DATABASE_ERROR',
      };
  }
}

/**
 * Create an operational error (expected application error)
 */
export function createAppError(
  message: string,
  statusCode: number = 400,
  code: string = 'APP_ERROR'
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.isOperational = true;
  
  return error;
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: [...T, NextFunction]): void => {
    const next = args[args.length - 1] as NextFunction;
    const fnArgs = args.slice(0, -1) as T;
    
    Promise.resolve(fn(...fnArgs)).catch(next);
  };
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
}