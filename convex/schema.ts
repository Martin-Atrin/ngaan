import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Family groups that contain parents and children
  families: defineTable({
    lineGroupId: v.optional(v.string()), // LINE group chat ID
    name: v.optional(v.string()),
    inviteCode: v.string(), // Unique invite code for joining
    createdBy: v.id("users"),
    settings: v.optional(v.any()), // Family-specific settings
  })
    .index("by_line_group", ["lineGroupId"])
    .index("by_invite_code", ["inviteCode"])
    .index("by_creator", ["createdBy"]),

  // Family members - separate from users for better data organization
  familyMembers: defineTable({
    familyId: v.id("families"),
    userId: v.id("users"),
    role: v.union(v.literal("parent"), v.literal("child")),
    status: v.union(
      v.literal("pending"), 
      v.literal("active"), 
      v.literal("removed")
    ),
    isAdmin: v.boolean(),
    invitedBy: v.optional(v.id("users")),
  })
    .index("by_family", ["familyId"])
    .index("by_user", ["userId"])
    .index("by_family_user", ["familyId", "userId"]),

  // Individual users
  users: defineTable({
    lineUserId: v.string(), // LINE user ID
    displayName: v.string(),
    pictureUrl: v.optional(v.string()),
    email: v.optional(v.string()),
    walletAddress: v.optional(v.string()), // Kaia wallet address
    dateOfBirth: v.optional(v.number()), // timestamp
    preferences: v.optional(v.any()),
    isActive: v.boolean(),
    lastLoginAt: v.optional(v.number()), // timestamp
    termsAcceptedAt: v.optional(v.number()), // timestamp
    age: v.optional(v.number()), // for child users
  })
    .index("by_line_user_id", ["lineUserId"])
    .index("by_email", ["email"]),

  // User profiles for extended information
  userProfiles: defineTable({
    userId: v.id("users"),
    bio: v.optional(v.string()),
    birthday: v.optional(v.number()), // timestamp
    favoriteColor: v.optional(v.string()),
    interests: v.array(v.string()),
    avatarUrl: v.optional(v.string()),
    themePreference: v.union(
      v.literal("light"), 
      v.literal("dark"), 
      v.literal("auto")
    ),
  })
    .index("by_user", ["userId"]),

  // User notification preferences
  userPreferences: defineTable({
    userId: v.id("users"),
    emailNotifications: v.boolean(),
    pushNotifications: v.boolean(),
    lineNotifications: v.boolean(),
    taskReminders: v.boolean(),
    achievementAlerts: v.boolean(),
    weeklyReports: v.boolean(),
    privacyLevel: v.union(
      v.literal("public"), 
      v.literal("family"), 
      v.literal("private")
    ),
  })
    .index("by_user", ["userId"]),

  // Family settings
  familySettings: defineTable({
    familyId: v.id("families"),
    currency: v.string(),
    defaultRewardAmount: v.number(),
    autoApprovalEnabled: v.boolean(),
    photoRequired: v.boolean(),
    notificationPreferences: v.optional(v.any()),
    taskCategories: v.array(v.string()),
  })
    .index("by_family", ["familyId"]),

  // Tasks
  tasks: defineTable({
    familyId: v.id("families"),
    createdById: v.id("users"),
    assignedToId: v.optional(v.id("users")),
    title: v.string(),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
    category: v.union(
      v.literal("cleaning"),
      v.literal("study"),
      v.literal("outdoor"),
      v.literal("personal"),
      v.literal("cooking"),
      v.literal("pets"),
      v.literal("organizing"),
      v.literal("other")
    ),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    rewardAmount: v.number(), // in KAIA wei
    estimatedTime: v.optional(v.number()), // in minutes
    status: v.union(
      v.literal("draft"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("submitted"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed"),
      v.literal("expired")
    ),
    priority: v.number(), // 1-5
    dueDate: v.optional(v.number()), // timestamp
    completedAt: v.optional(v.number()), // timestamp
    isRecurring: v.boolean(),
    recurringConfig: v.optional(v.any()),
    metadata: v.optional(v.any()),
  })
    .index("by_family", ["familyId"])
    .index("by_assigned_to", ["assignedToId"])
    .index("by_creator", ["createdById"])
    .index("by_status", ["status"])
    .index("by_family_status", ["familyId", "status"])
    .index("by_due_date", ["dueDate"]),

  // Task attachments
  taskAttachments: defineTable({
    taskId: v.id("tasks"),
    filename: v.string(),
    fileUrl: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
  })
    .index("by_task", ["taskId"]),

  // Task submissions by children
  taskSubmissions: defineTable({
    taskId: v.id("tasks"),
    submittedById: v.id("users"),
    photoUrls: v.array(v.string()),
    notes: v.optional(v.string()),
    submittedAt: v.number(), // timestamp
    metadata: v.optional(v.any()),
  })
    .index("by_task", ["taskId"])
    .index("by_submitter", ["submittedById"]),

  // Task approvals by parents
  taskApprovals: defineTable({
    submissionId: v.id("taskSubmissions"),
    taskId: v.id("tasks"),
    approvedById: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("needs_revision")
    ),
    comments: v.optional(v.string()),
    rating: v.optional(v.number()), // 1-5
    approvedAt: v.number(), // timestamp
  })
    .index("by_submission", ["submissionId"])
    .index("by_task", ["taskId"])
    .index("by_approver", ["approvedById"]),

  // Blockchain transactions
  transactions: defineTable({
    taskId: v.optional(v.id("tasks")),
    userId: v.id("users"), // recipient
    type: v.union(
      v.literal("task_reward"),
      v.literal("bonus_payment"),
      v.literal("allowance"),
      v.literal("family_contribution")
    ),
    amount: v.string(), // KAIA amount as string
    txHash: v.optional(v.string()),
    blockNumber: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    gasUsed: v.optional(v.string()),
    gasFee: v.optional(v.string()),
    fromAddress: v.string(),
    toAddress: v.string(),
    metadata: v.optional(v.any()),
    confirmedAt: v.optional(v.number()), // timestamp
  })
    .index("by_user", ["userId"])
    .index("by_task", ["taskId"])
    .index("by_tx_hash", ["txHash"])
    .index("by_status", ["status"]),

  // Family reward pools
  familyRewardPools: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    balance: v.string(), // KAIA amount as string
    contributorInfo: v.optional(v.any()),
    isActive: v.boolean(),
  })
    .index("by_family", ["familyId"]),

  // Achievements for gamification
  achievements: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("task_streak"),
      v.literal("task_count"),
      v.literal("category_master"),
      v.literal("early_bird"),
      v.literal("perfectionist"),
      v.literal("saver"),
      v.literal("helper"),
      v.literal("consistent")
    ),
    title: v.string(),
    description: v.string(),
    iconUrl: v.optional(v.string()),
    badgeLevel: v.number(), // 1=Bronze, 2=Silver, 3=Gold
    progress: v.number(),
    target: v.number(),
    isEarned: v.boolean(),
    earnedAt: v.optional(v.number()), // timestamp
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_earned", ["isEarned"]),

  // Savings goals for financial literacy
  savingsGoals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    targetAmount: v.string(),
    currentAmount: v.string(),
    deadline: v.optional(v.number()), // timestamp
    isCompleted: v.boolean(),
    completedAt: v.optional(v.number()), // timestamp
  })
    .index("by_user", ["userId"]),

  // Expense tracking
  expenses: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    amount: v.string(),
    category: v.union(
      v.literal("food"),
      v.literal("entertainment"),
      v.literal("education"),
      v.literal("toys"),
      v.literal("clothes"),
      v.literal("gifts"),
      v.literal("savings"),
      v.literal("other")
    ),
    date: v.number(), // timestamp
    receiptUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_date", ["date"]),

  // Family invites
  familyInvites: defineTable({
    familyId: v.id("families"),
    inviteCode: v.string(),
    createdBy: v.id("users"),
    expiresAt: v.number(), // timestamp
    maxUses: v.number(),
    usedCount: v.number(),
    isActive: v.boolean(),
  })
    .index("by_family", ["familyId"])
    .index("by_code", ["inviteCode"])
    .index("by_creator", ["createdBy"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("task_assigned"),
      v.literal("task_completed"),
      v.literal("reward_received"),
      v.literal("achievement_earned"),
      v.literal("reminder"),
      v.literal("family_invite"),
      v.literal("approval_request")
    ),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    isRead: v.boolean(),
    readAt: v.optional(v.number()), // timestamp
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "isRead"])
    .index("by_type", ["type"]),
});