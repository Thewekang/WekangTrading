/**
 * API Error Handling Utilities
 * Provides consistent error handling patterns across API routes
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE: 'DUPLICATE',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // Generic errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

/**
 * Handle errors in API routes consistently
 * @param error - The error to handle
 * @param context - Optional context for logging (e.g., API route name)
 * @returns NextResponse with appropriate error structure and status code
 */
export function handleApiError(error: unknown, context?: string): NextResponse<ApiResponse> {
  // Log error for debugging
  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error('API Error:', error);
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Validation failed',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  // Prisma known errors
  if (error instanceof PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DUPLICATE,
            message: 'A record with this information already exists',
            details: { prismaCode: error.code },
          },
        },
        { status: 409 }
      );
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.CONSTRAINT_VIOLATION,
            message: 'Invalid reference to related record',
            details: { prismaCode: error.code },
          },
        },
        { status: 400 }
      );
    }

    // Record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Record not found',
            details: { prismaCode: error.code },
          },
        },
        { status: 404 }
      );
    }

    // Generic Prisma error
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.DATABASE_ERROR,
          message: 'Database operation failed',
          details: process.env.NODE_ENV === 'development' ? { prismaCode: error.code } : undefined,
        },
      },
      { status: 500 }
    );
  }

  // Generic Error objects
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An unexpected error occurred';
      
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message,
          details: process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
        },
      },
      { status: 500 }
    );
  }

  // Unknown error type
  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, status: number = 200, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Create an error response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

/**
 * Check if user is authenticated
 * Returns error response if not authenticated
 */
export function requireAuth(session: any): NextResponse<ApiResponse> | null {
  if (!session?.user) {
    return errorResponse(ErrorCodes.UNAUTHORIZED, 'Not authenticated', 401);
  }
  return null;
}

/**
 * Check if user has admin role
 * Returns error response if not admin
 */
export function requireAdmin(session: any): NextResponse<ApiResponse> | null {
  const authError = requireAuth(session);
  if (authError) return authError;

  if (session.user.role !== 'ADMIN') {
    return errorResponse(ErrorCodes.FORBIDDEN, 'Admin access required', 403);
  }
  return null;
}

/**
 * Check if user owns the resource or is admin
 * Returns error response if forbidden
 */
export function requireOwnership(session: any, resourceUserId: string): NextResponse<ApiResponse> | null {
  const authError = requireAuth(session);
  if (authError) return authError;

  if (session.user.id !== resourceUserId && session.user.role !== 'ADMIN') {
    return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied', 403);
  }
  return null;
}
