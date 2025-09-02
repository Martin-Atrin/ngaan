import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireParentRole } from '../middleware/auth';
import { createAppError, asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/families/current
 * Get current family details
 */
router.get('/current', asyncHandler(async (req, res) => {
  if (!req.familyId) {
    throw createAppError('Family not found', 404, 'FAMILY_NOT_FOUND');
  }

  const family = await prisma.family.findUnique({
    where: { id: req.familyId },
    include: {
      users: {
        select: {
          id: true,
          displayName: true,
          pictureUrl: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: {
          tasks: true,
          rewardPools: true,
        },
      },
    },
  });

  if (!family) {
    throw createAppError('Family not found', 404, 'FAMILY_NOT_FOUND');
  }

  res.json({
    success: true,
    data: family,
  });
}));

export default router;