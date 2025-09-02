import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createAppError, asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', asyncHandler(async (req, res) => {
  if (!req.user) {
    throw createAppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: req.user,
  });
}));

export default router;