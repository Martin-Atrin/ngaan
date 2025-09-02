import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireParentRole, requireChildRole } from '../middleware/auth';
import { createAppError, asyncHandler } from '../middleware/errorHandler';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  instructions: z.string().max(1000, 'Instructions too long').optional(),
  category: z.enum(['CLEANING', 'STUDYING', 'OUTDOOR', 'PERSONAL_CARE', 'COOKING', 'ORGANIZING', 'PET_CARE', 'OTHER']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  rewardAmount: z.number().int().min(1, 'Reward amount must be positive'),
  estimatedTime: z.number().int().min(1).max(480).optional(), // Max 8 hours
  assignedToId: z.string().cuid().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.number().int().min(1).max(5).default(3),
  isRecurring: z.boolean().default(false),
  recurringConfig: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number().int().min(1).max(12),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
});

const updateTaskSchema = createTaskSchema.partial();

const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(50)).default('10'),
  status: z.enum(['DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED', 'EXPIRED']).optional(),
  category: z.enum(['CLEANING', 'STUDYING', 'OUTDOOR', 'PERSONAL_CARE', 'COOKING', 'ORGANIZING', 'PET_CARE', 'OTHER']).optional(),
  assignedToId: z.string().cuid().optional(),
  createdById: z.string().cuid().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/tasks
 * Get tasks with filtering and pagination
 */
router.get('/', asyncHandler(async (req, res) => {
  const query = querySchema.parse(req.query);
  const { page, limit, status, category, assignedToId, createdById, search, sortBy, sortOrder } = query;

  if (!req.familyId) {
    throw createAppError('Family ID not found', 400, 'FAMILY_ID_MISSING');
  }

  // Build filter conditions
  const where: any = {
    familyId: req.familyId,
  };

  if (status) where.status = status;
  if (category) where.category = category;
  if (assignedToId) where.assignedToId = assignedToId;
  if (createdById) where.createdById = createdById;
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get tasks with relations
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            pictureUrl: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            displayName: true,
            pictureUrl: true,
            role: true,
          },
        },
        submissions: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
          include: {
            approvals: {
              orderBy: { approvedAt: 'desc' },
              take: 1,
            },
          },
        },
        _count: {
          select: {
            submissions: true,
            transactions: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}));

/**
 * GET /api/tasks/:id
 * Get single task by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          pictureUrl: true,
          role: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          displayName: true,
          pictureUrl: true,
          role: true,
        },
      },
      submissions: {
        include: {
          submittedBy: {
            select: {
              id: true,
              displayName: true,
              pictureUrl: true,
            },
          },
          approvals: {
            include: {
              approvedBy: {
                select: {
                  id: true,
                  displayName: true,
                  pictureUrl: true,
                },
              },
            },
            orderBy: { approvedAt: 'desc' },
          },
        },
        orderBy: { submittedAt: 'desc' },
      },
      attachments: true,
      transactions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!task) {
    throw createAppError('Task not found', 404, 'TASK_NOT_FOUND');
  }

  // Verify user has access to this task
  if (task.familyId !== req.familyId) {
    throw createAppError('Access denied', 403, 'ACCESS_DENIED');
  }

  res.json({
    success: true,
    data: task,
  });
}));

/**
 * POST /api/tasks
 * Create new task (parents only)
 */
router.post('/', requireParentRole, asyncHandler(async (req, res) => {
  const validatedData = createTaskSchema.parse(req.body);

  if (!req.familyId || !req.userId) {
    throw createAppError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  // Verify assigned user is in same family (if provided)
  if (validatedData.assignedToId) {
    const assignedUser = await prisma.user.findUnique({
      where: { id: validatedData.assignedToId },
    });

    if (!assignedUser || assignedUser.familyId !== req.familyId) {
      throw createAppError('Assigned user not found in family', 404, 'ASSIGNED_USER_NOT_FOUND');
    }

    if (assignedUser.role !== 'CHILD') {
      throw createAppError('Tasks can only be assigned to children', 400, 'INVALID_ASSIGNEE');
    }
  }

  const task = await prisma.task.create({
    data: {
      ...validatedData,
      familyId: req.familyId,
      createdById: req.userId,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      status: validatedData.assignedToId ? 'ASSIGNED' : 'DRAFT',
    },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          pictureUrl: true,
          role: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          displayName: true,
          pictureUrl: true,
          role: true,
        },
      },
    },
  });

  // TODO: Send notification to assigned child

  res.status(201).json({
    success: true,
    data: task,
  });
}));

/**
 * PUT /api/tasks/:id
 * Update task (parents only, or assigned child for status updates)
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const validatedData = updateTaskSchema.parse(req.body);

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignedTo: true,
      createdBy: true,
    },
  });

  if (!task) {
    throw createAppError('Task not found', 404, 'TASK_NOT_FOUND');
  }

  if (task.familyId !== req.familyId) {
    throw createAppError('Access denied', 403, 'ACCESS_DENIED');
  }

  // Permission checks
  const isParent = req.user?.role === 'PARENT';
  const isAssignedChild = req.user?.role === 'CHILD' && task.assignedToId === req.userId;

  if (!isParent && !isAssignedChild) {
    throw createAppError('Access denied', 403, 'ACCESS_DENIED');
  }

  // Children can only update status to IN_PROGRESS
  if (!isParent && validatedData.status && validatedData.status !== 'IN_PROGRESS') {
    throw createAppError('Children can only start tasks', 403, 'INVALID_STATUS_UPDATE');
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      ...validatedData,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          pictureUrl: true,
          role: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          displayName: true,
          pictureUrl: true,
          role: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: updatedTask,
  });
}));

/**
 * DELETE /api/tasks/:id
 * Delete task (parents only)
 */
router.delete('/:id', requireParentRole, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await prisma.task.findUnique({
    where: { id },
  });

  if (!task) {
    throw createAppError('Task not found', 404, 'TASK_NOT_FOUND');
  }

  if (task.familyId !== req.familyId) {
    throw createAppError('Access denied', 403, 'ACCESS_DENIED');
  }

  // Prevent deletion of tasks with submissions
  const submissionCount = await prisma.taskSubmission.count({
    where: { taskId: id },
  });

  if (submissionCount > 0) {
    throw createAppError('Cannot delete task with submissions', 400, 'TASK_HAS_SUBMISSIONS');
  }

  await prisma.task.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Task deleted successfully',
  });
}));

/**
 * POST /api/tasks/:id/assign
 * Assign task to child (parents only)
 */
router.post('/:id/assign', requireParentRole, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assignedToId } = z.object({
    assignedToId: z.string().cuid(),
  }).parse(req.body);

  const task = await prisma.task.findUnique({
    where: { id },
  });

  if (!task) {
    throw createAppError('Task not found', 404, 'TASK_NOT_FOUND');
  }

  if (task.familyId !== req.familyId) {
    throw createAppError('Access denied', 403, 'ACCESS_DENIED');
  }

  // Verify assignee is child in same family
  const assignee = await prisma.user.findUnique({
    where: { id: assignedToId },
  });

  if (!assignee || assignee.familyId !== req.familyId || assignee.role !== 'CHILD') {
    throw createAppError('Invalid assignee', 400, 'INVALID_ASSIGNEE');
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      assignedToId,
      status: 'ASSIGNED',
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          displayName: true,
          pictureUrl: true,
          role: true,
        },
      },
    },
  });

  // TODO: Send notification to assigned child

  res.json({
    success: true,
    data: updatedTask,
  });
}));

export default router;