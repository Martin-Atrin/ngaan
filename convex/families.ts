import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new family (parents only)
export const createFamily = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    settings: v.optional(v.object({
      defaultRewardAmount: v.number(),
      autoApprovalEnabled: v.boolean(),
      photoRequired: v.boolean(),
      taskCategories: v.array(v.string()),
    })),
  },
  handler: async (ctx, { userId, name, description, settings }) => {
    // Check if user is already in a family
    const existingMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingMember) {
      throw new Error("User already belongs to a family");
    }

    // Generate unique invite code
    const inviteCode = generateUniqueInviteCode();

    // Create family
    const familyId = await ctx.db.insert("families", {
      name: name.trim(),
      inviteCode,
      createdBy: userId,
      settings: description ? { description } : undefined,
    });

    // Add creator as family member with admin rights
    await ctx.db.insert("familyMembers", {
      familyId,
      userId,
      role: "parent",
      status: "active",
      isAdmin: true,
    });

    // Create family settings
    await ctx.db.insert("familySettings", {
      familyId,
      currency: "KAIA",
      defaultRewardAmount: settings?.defaultRewardAmount || 100,
      autoApprovalEnabled: settings?.autoApprovalEnabled || false,
      photoRequired: settings?.photoRequired || true,
      taskCategories: settings?.taskCategories || ["cleaning", "study", "outdoor", "personal"],
    });

    return { familyId, inviteCode };
  },
});

// Generate family invite
export const generateFamilyInvite = mutation({
  args: {
    familyId: v.id("families"),
    userId: v.id("users"),
    expiresIn: v.number(), // days
    maxUses: v.number(),
  },
  handler: async (ctx, { familyId, userId, expiresIn, maxUses }) => {
    // Verify user is parent/admin in this family
    const familyMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_family_user", (q) => 
        q.eq("familyId", familyId).eq("userId", userId)
      )
      .first();

    if (!familyMember || familyMember.role !== "parent") {
      throw new Error("Only family parents can create invites");
    }

    // Deactivate existing invites for this family
    const existingInvites = await ctx.db
      .query("familyInvites")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const invite of existingInvites) {
      await ctx.db.patch(invite._id, { isActive: false });
    }

    // Create new invite
    const inviteCode = generateUniqueInviteCode();
    const expiresAt = Date.now() + (expiresIn * 24 * 60 * 60 * 1000);

    const inviteId = await ctx.db.insert("familyInvites", {
      familyId,
      inviteCode,
      createdBy: userId,
      expiresAt,
      maxUses,
      usedCount: 0,
      isActive: true,
    });

    const family = await ctx.db.get(familyId);
    const creator = await ctx.db.get(userId);

    return {
      inviteId,
      code: inviteCode,
      expiresAt,
      maxUses,
      usedCount: 0,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/join/${inviteCode}`,
      familyName: family?.name,
      createdBy: creator?.displayName,
    };
  },
});

// Get invite details
export const getInviteDetails = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, { inviteCode }) => {
    const invite = await ctx.db
      .query("familyInvites")
      .withIndex("by_code", (q) => q.eq("inviteCode", inviteCode))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.gt(q.field("expiresAt"), Date.now()),
          q.lt(q.field("usedCount"), q.field("maxUses"))
        )
      )
      .first();

    if (!invite) return null;

    const family = await ctx.db.get(invite.familyId);
    const creator = await ctx.db.get(invite.createdBy);

    // Count family members
    const memberCount = await ctx.db
      .query("familyMembers")
      .withIndex("by_family", (q) => q.eq("familyId", invite.familyId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect()
      .then(members => members.length);

    return {
      familyName: family?.name,
      memberCount,
      createdBy: creator?.displayName,
      expiresAt: invite.expiresAt,
      usesRemaining: invite.maxUses - invite.usedCount,
    };
  },
});

// Join family with invite code
export const joinFamily = mutation({
  args: {
    userId: v.id("users"),
    inviteCode: v.string(),
  },
  handler: async (ctx, { userId, inviteCode }) => {
    // Find valid invite
    const invite = await ctx.db
      .query("familyInvites")
      .withIndex("by_code", (q) => q.eq("inviteCode", inviteCode))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.gt(q.field("expiresAt"), Date.now()),
          q.lt(q.field("usedCount"), q.field("maxUses"))
        )
      )
      .first();

    if (!invite) {
      throw new Error("Invalid or expired invite code");
    }

    // Check if user already in a family
    const existingMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingMember) {
      throw new Error("You are already a member of a family");
    }

    // Get user to verify role
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Create pending family membership (needs parent approval)
    await ctx.db.insert("familyMembers", {
      familyId: invite.familyId,
      userId,
      role: "child",
      status: "pending",
      isAdmin: false,
      invitedBy: invite.createdBy,
    });

    // Update invite usage count
    await ctx.db.patch(invite._id, {
      usedCount: invite.usedCount + 1,
    });

    const family = await ctx.db.get(invite.familyId);

    // Create notification for family parents
    const familyParents = await ctx.db
      .query("familyMembers")
      .withIndex("by_family", (q) => q.eq("familyId", invite.familyId))
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "parent"),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();

    for (const parent of familyParents) {
      await ctx.db.insert("notifications", {
        userId: parent.userId,
        type: "family_invite",
        title: "New Family Member Request",
        message: `${user.displayName} wants to join ${family?.name}`,
        data: { userId, familyId: invite.familyId },
        isRead: false,
      });
    }

    return {
      familyName: family?.name,
      status: "pending",
    };
  },
});

// Approve/reject family member
export const approveFamilyMember = mutation({
  args: {
    approverId: v.id("users"),
    memberId: v.id("familyMembers"),
    approved: v.boolean(),
  },
  handler: async (ctx, { approverId, memberId, approved }) => {
    const member = await ctx.db.get(memberId);
    if (!member) throw new Error("Member not found");

    // Verify approver is parent/admin in this family
    const approverMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_family_user", (q) => 
        q.eq("familyId", member.familyId).eq("userId", approverId)
      )
      .first();

    if (!approverMember || approverMember.role !== "parent") {
      throw new Error("Only family parents can approve members");
    }

    // Update member status
    await ctx.db.patch(memberId, {
      status: approved ? "active" : "removed",
    });

    // Notify the user about approval/rejection
    const user = await ctx.db.get(member.userId);
    const family = await ctx.db.get(member.familyId);
    
    await ctx.db.insert("notifications", {
      userId: member.userId,
      type: approved ? "family_invite" : "family_invite",
      title: approved ? "Welcome to the Family!" : "Family Request Declined",
      message: approved 
        ? `You've been approved to join ${family?.name}!`
        : `Your request to join ${family?.name} was declined.`,
      data: { familyId: member.familyId, approved },
      isRead: false,
    });

    return {
      status: approved ? "approved" : "rejected",
      userName: user?.displayName,
      familyName: family?.name,
    };
  },
});

// Get family overview
export const getFamilyOverview = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const familyMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!familyMember) return null;

    const family = await ctx.db.get(familyMember.familyId);
    const familySettings = await ctx.db
      .query("familySettings")
      .withIndex("by_family", (q) => q.eq("familyId", familyMember.familyId))
      .first();

    // Get family members
    const members = await ctx.db
      .query("familyMembers")
      .withIndex("by_family", (q) => q.eq("familyId", familyMember.familyId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          user,
        };
      })
    );

    // Get active tasks count
    const activeTasks = await ctx.db
      .query("tasks")
      .withIndex("by_family_status", (q) => 
        q.eq("familyId", familyMember.familyId).eq("status", "assigned")
      )
      .collect();

    // Get total rewards distributed (placeholder for now)
    const totalRewards = 0; // TODO: Calculate from completed transactions

    return {
      family,
      familySettings,
      members: memberDetails,
      memberCount: memberDetails.length,
      activeTasksCount: activeTasks.length,
      totalRewardsDistributed: totalRewards,
      userRole: familyMember.role,
      isAdmin: familyMember.isAdmin,
    };
  },
});

// Helper function to generate unique invite codes
function generateUniqueInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'FAM-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}