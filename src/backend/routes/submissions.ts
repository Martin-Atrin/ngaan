import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireChildRole } from '../middleware/auth';
import { createAppError, asyncHandler } from '../middleware/errorHandler';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const createSubmissionSchema = z.object({
  taskId: z.string().cuid(),
  photoUrls: z.array(z.string().url()).min(1, 'At least one photo required'),
  notes: z.string().max(500).optional(),
});

/**
 * POST /api/submissions
 * Submit task completion (children only)
 */
router.post('/', requireChildRole, asyncHandler(async (req, res) => {
  const validatedData = createSubmissionSchema.parse(req.body);
  const { taskId, photoUrls, notes } = validatedData;

  if (!req.userId) {
    throw createAppError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  // Verify task exists and is assigned to this child
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw createAppError('Task not found', 404, 'TASK_NOT_FOUND');
  }

  if (task.assignedToId !== req.userId) {
    throw createAppError('Task not assigned to you', 403, 'ACCESS_DENIED');
  }

  if (task.status === 'COMPLETED') {
    throw createAppError('Task already completed', 400, 'TASK_ALREADY_COMPLETED');
  }

  const submission = await prisma.taskSubmission.create({
    data: {
      taskId,
      submittedById: req.userId,
      photoUrls,
      notes,
    },
    include: {
      task: {
        select: {
          title: true,
          rewardAmount: true,
        },
      },
    },
  });

  // Update task status
  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'SUBMITTED' },
  });

  res.status(201).json({
    success: true,
    data: submission,
  });
}));

export default router;