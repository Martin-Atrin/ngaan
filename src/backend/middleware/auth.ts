import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { User } from '@/types';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
      familyId?: string;
    }
  }
}

export interface JWTPayload {
  userId: string;
  lineUserId: string;
  familyId: string;
  role: 'PARENT' | 'CHILD';
  iat?: number;
  exp?: number;
}

/**
 * Middleware to authenticate JWT tokens and attach user to request
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'AUTH_TOKEN_MISSING',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      res.status(500).json({
        success: false,
        error: 'Server configuration error',
        code: 'JWT_SECRET_MISSING',
      });
      return;
    }

    // Verify and decode token
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token has expired',
          code: 'AUTH_TOKEN_EXPIRED',
        });
        return;
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          code: 'AUTH_TOKEN_INVALID',
        });
        return;
      }
      throw jwtError;
    }

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        family: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'User account is deactivated',
        code: 'USER_DEACTIVATED',
      });
      return;
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Attach user info to request
    req.user = user as User;
    req.userId = user.id;
    req.familyId = user.familyId;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }
}

/**
 * Middleware to ensure user is a parent
 */
export function requireParentRole(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  if (req.user.role !== 'PARENT') {
    res.status(403).json({
      success: false,
      error: 'Parent role required',
      code: 'PARENT_ROLE_REQUIRED',
    });
    return;
  }

  next();
}

/**
 * Middleware to ensure user is a child
 */
export function requireChildRole(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  if (req.user.role !== 'CHILD') {
    res.status(403).json({
      success: false,
      error: 'Child role required',
      code: 'CHILD_ROLE_REQUIRED',
    });
    return;
  }

  next();
}

/**
 * Middleware to ensure user belongs to the specified family
 */
export function requireFamilyMember(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const familyId = req.params.familyId || req.body.familyId || req.query.familyId;
  
  if (familyId && req.user.familyId !== familyId) {
    res.status(403).json({
      success: false,
      error: 'Access denied to this family',
      code: 'FAMILY_ACCESS_DENIED',
    });
    return;
  }

  next();
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: {
  id: string;
  lineUserId: string;
  familyId: string;
  role: 'PARENT' | 'CHILD';
}): string {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const payload: JWTPayload = {
    userId: user.id,
    lineUserId: user.lineUserId,
    familyId: user.familyId,
    role: user.role,
  };

  return jwt.sign(payload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'ngaan-api',
    audience: 'ngaan-app',
  } as jwt.SignOptions);
}

/**
 * Verify LINE ID token (placeholder for LINE verification)
 */
export async function verifyLineToken(idToken: string): Promise<{
  userId: string;
  displayName: string;
  pictureUrl?: string;
} | null> {
  // TODO: Implement actual LINE ID token verification
  // This is a placeholder implementation
  try {
    // In production, verify with LINE's API
    // For now, return mock data for development
    if (process.env.NODE_ENV === 'development') {
      const mockPayload = jwt.decode(idToken) as any;
      return {
        userId: mockPayload?.sub || 'U1234567890abcdef',
        displayName: mockPayload?.name || 'Test User',
        pictureUrl: mockPayload?.picture,
      };
    }
    
    // Production LINE verification would go here
    return null;
  } catch (error) {
    console.error('LINE token verification failed:', error);
    return null;
  }
}