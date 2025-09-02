import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// LINE OAuth login/register
export const loginWithLINE = mutation({
  args: {
    lineUserId: v.string(),
    displayName: v.string(),
    pictureUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { lineUserId, displayName, pictureUrl, email }) => {
    // Check if user exists
    let user = await ctx.db
      .query("users")
      .withIndex("by_line_user_id", (q) => q.eq("lineUserId", lineUserId))
      .first();

    if (!user) {
      // Create new user
      const userId = await ctx.db.insert("users", {
        lineUserId,
        displayName,
        pictureUrl,
        email,
        isActive: true,
        lastLoginAt: Date.now(),
      });

      // Create default user profile
      await ctx.db.insert("userProfiles", {
        userId,
        interests: [],
        themePreference: "light",
      });

      // Create default preferences
      await ctx.db.insert("userPreferences", {
        userId,
        emailNotifications: true,
        pushNotifications: true,
        lineNotifications: true,
        taskReminders: true,
        achievementAlerts: true,
        weeklyReports: true,
        privacyLevel: "family",
      });

      user = await ctx.db.get(userId);
    } else {
      // Update last login
      await ctx.db.patch(user._id, {
        lastLoginAt: Date.now(),
        displayName, // Update display name in case it changed
        pictureUrl, // Update picture URL
      });
    }

    // Check if user is in a family
    const familyMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", user!._id))
      .first();

    return {
      user,
      familyMember,
      needsRoleSelection: !familyMember,
    };
  },
});

// Select user role (parent/child)
export const selectRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("parent"), v.literal("child")),
    age: v.optional(v.number()),
  },
  handler: async (ctx, { userId, role, age }) => {
    // Check if user already has a role
    const existingMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingMember) {
      throw new Error("User already has a role assigned");
    }

    // Update user with terms acceptance and age
    await ctx.db.patch(userId, {
      termsAcceptedAt: Date.now(),
      age: role === "child" ? age : undefined,
    });

    if (role === "parent") {
      // Parents create their own family
      const user = await ctx.db.get(userId);
      if (!user) throw new Error("User not found");

      // Generate unique invite code
      const inviteCode = generateInviteCode();
      
      const familyId = await ctx.db.insert("families", {
        name: `${user.displayName}'s Family`,
        inviteCode,
        createdBy: userId,
      });

      // Add parent as family member with admin rights
      await ctx.db.insert("familyMembers", {
        familyId,
        userId,
        role: "parent",
        status: "active",
        isAdmin: true,
      });

      // Create default family settings
      await ctx.db.insert("familySettings", {
        familyId,
        currency: "KAIA",
        defaultRewardAmount: 100,
        autoApprovalEnabled: false,
        photoRequired: true,
        taskCategories: ["cleaning", "study", "outdoor", "personal"],
      });

      return { role, familyId, needsFamilyInvite: false };
    } else {
      // Children need to join a family
      return { role, familyId: null, needsFamilyInvite: true };
    }
  },
});

// Get current user profile
export const getCurrentUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const familyMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    let family = null;
    if (familyMember) {
      family = await ctx.db.get(familyMember.familyId);
    }

    return {
      user,
      familyMember,
      family,
      profile,
      preferences,
    };
  },
});

// Helper function to generate invite codes
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}