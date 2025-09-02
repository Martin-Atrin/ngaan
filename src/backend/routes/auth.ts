import express from 'express';
import { PrismaClient } from '@prisma/client';
import { generateToken, verifyLineToken } from '../middleware/auth';
import { createAppError, asyncHandler } from '../middleware/errorHandler';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const loginSchema = z.object({
  idToken: z.string().min(1, 'LINE ID token is required'),
  displayName: z.string().min(1, 'Display name is required'),
  pictureUrl: z.string().url().optional(),
});

const registerSchema = z.object({
  idToken: z.string().min(1, 'LINE ID token is required'),
  displayName: z.string().min(1, 'Display name is required'),
  pictureUrl: z.string().url().optional(),
  role: z.enum(['PARENT', 'CHILD']),
  dateOfBirth: z.string().datetime().optional(),
  familyId: z.string().cuid().optional(), // For joining existing family
});

/**
 * POST /api/auth/login
 * Authenticate user with LINE ID token
 */
router.post('/login', asyncHandler(async (req, res) => {
  const validatedData = loginSchema.parse(req.body);
  const { idToken, displayName, pictureUrl } = validatedData;

  // Verify LINE ID token
  const lineProfile = await verifyLineToken(idToken);
  if (!lineProfile) {
    throw createAppError('Invalid LINE ID token', 401, 'INVALID_LINE_TOKEN');
  }

  // Find existing user
  const user = await prisma.user.findUnique({
    where: { lineUserId: lineProfile.userId },
    include: {
      family: true,
    },
  });

  if (!user) {
    // User doesn't exist, return registration required
    return res.status(404).json({
      success: false,
      error: 'User not found',
      code: 'REGISTRATION_REQUIRED',
      data: {
        lineUserId: lineProfile.userId,
        displayName: lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl,
      },
    });
  }

  if (!user.isActive) {
    throw createAppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
  }

  // Update user profile if needed
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName,
      pictureUrl,
      lastLoginAt: new Date(),
    },
    include: {
      family: true,
    },
  });

  // Generate JWT token
  const token = generateToken(updatedUser);

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: updatedUser.id,
        lineUserId: updatedUser.lineUserId,
        familyId: updatedUser.familyId,
        role: updatedUser.role,
        displayName: updatedUser.displayName,
        pictureUrl: updatedUser.pictureUrl,
        dateOfBirth: updatedUser.dateOfBirth,
        preferences: updatedUser.preferences,
        createdAt: updatedUser.createdAt,
        family: updatedUser.family,
      },
    },
  });
}));

/**
 * POST /api/auth/register
 * Register new user with LINE ID token
 */
router.post('/register', asyncHandler(async (req, res) => {
  const validatedData = registerSchema.parse(req.body);
  const { idToken, displayName, pictureUrl, role, dateOfBirth, familyId } = validatedData;

  // Verify LINE ID token
  const lineProfile = await verifyLineToken(idToken);
  if (!lineProfile) {
    throw createAppError('Invalid LINE ID token', 401, 'INVALID_LINE_TOKEN');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { lineUserId: lineProfile.userId },
  });

  if (existingUser) {
    throw createAppError('User already exists', 409, 'USER_EXISTS');
  }

  // Handle family logic
  let targetFamilyId = familyId;

  if (!targetFamilyId) {
    // Create new family if none provided
    const newFamily = await prisma.family.create({
      data: {
        name: `${displayName}'s Family`,
      },
    });
    targetFamilyId = newFamily.id;
  } else {
    // Verify family exists
    const family = await prisma.family.findUnique({
      where: { id: familyId },
    });
    
    if (!family) {
      throw createAppError('Family not found', 404, 'FAMILY_NOT_FOUND');
    }
  }

  // Create new user
  const user = await prisma.user.create({
    data: {
      lineUserId: lineProfile.userId,
      familyId: targetFamilyId,
      role,
      displayName,
      pictureUrl,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      lastLoginAt: new Date(),
    },
    include: {
      family: true,
    },
  });

  // Generate JWT token
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        lineUserId: user.lineUserId,
        familyId: user.familyId,
        role: user.role,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        dateOfBirth: user.dateOfBirth,
        preferences: user.preferences,
        createdAt: user.createdAt,
        family: user.family,
      },
    },
  });
}));

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', (req, res) => {
  // In JWT-based auth, logout is typically handled client-side
  // Server could maintain a blacklist of tokens, but for simplicity we'll rely on client
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw createAppError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const token = authHeader.substring(7);
  // Token verification would happen in auth middleware
  // For now, return basic structure
  
  res.json({
    success: true,
    message: 'Authentication endpoint - implement with auth middleware',
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh JWT token (placeholder for token refresh logic)
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  // Implement token refresh logic if needed
  // For now, return placeholder
  res.json({
    success: true,
    message: 'Token refresh - implement if needed',
  });
}));

export default router;