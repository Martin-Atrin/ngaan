// Core application types based on Prisma schema and business logic

export type UserRole = 'PARENT' | 'CHILD';
export type TaskStatus = 'DRAFT' | 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'EXPIRED';
export type TaskDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type TaskCategory = 'CLEANING' | 'STUDYING' | 'OUTDOOR' | 'PERSONAL_CARE' | 'COOKING' | 'ORGANIZING' | 'PET_CARE' | 'OTHER';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';
export type TransactionType = 'TASK_REWARD' | 'BONUS_PAYMENT' | 'ALLOWANCE' | 'FAMILY_CONTRIBUTION';
export type AchievementType = 'TASK_STREAK' | 'TASK_COUNT' | 'CATEGORY_MASTER' | 'EARLY_BIRD' | 'PERFECTIONIST' | 'SAVER' | 'HELPER' | 'CONSISTENT';

// User and Family types
export interface User {
  id: string;
  lineUserId: string;
  familyId: string;
  role: UserRole;
  displayName: string;
  pictureUrl?: string;
  walletAddress?: string;
  dateOfBirth?: Date;
  preferences?: Record<string, any>;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Family {
  id: string;
  lineGroupId?: string;
  name?: string;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  users?: User[];
}

// Task-related types
export interface Task {
  id: string;
  familyId: string;
  createdById: string;
  assignedToId?: string;
  title: string;
  description?: string;
  instructions?: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  rewardAmount: number; // in KAIA wei
  estimatedTime?: number; // in minutes
  status: TaskStatus;
  priority: number; // 1-5
  dueDate?: Date;
  completedAt?: Date;
  isRecurring: boolean;
  recurringConfig?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  createdBy?: User;
  assignedTo?: User;
  submissions?: TaskSubmission[];
  approvals?: TaskApproval[];
  attachments?: TaskAttachment[];
  transactions?: Transaction[];
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  submittedById: string;
  photoUrls: string[];
  notes?: string;
  submittedAt: Date;
  metadata?: Record<string, any>;
  
  // Relations
  submittedBy?: User;
  approvals?: TaskApproval[];
}

export interface TaskApproval {
  id: string;
  submissionId: string;
  taskId: string;
  approvedById: string;
  status: ApprovalStatus;
  comments?: string;
  rating?: number; // 1-5
  approvedAt: Date;
  
  // Relations
  approvedBy?: User;
}

// Blockchain and Transaction types
export interface Transaction {
  id: string;
  taskId?: string;
  userId: string;
  type: TransactionType;
  amount: string; // KAIA amount as string
  txHash?: string;
  blockNumber?: bigint;
  status: TransactionStatus;
  gasUsed?: string;
  gasFee?: string;
  fromAddress: string;
  toAddress: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  
  // Relations
  user?: User;
  task?: Task;
}

export interface FamilyRewardPool {
  id: string;
  familyId: string;
  name: string;
  balance: string; // KAIA amount as string
  contributorInfo?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Achievement and Gamification types
export interface Achievement {
  id: string;
  userId: string;
  type: AchievementType;
  title: string;
  description: string;
  iconUrl?: string;
  badgeLevel: number; // Bronze=1, Silver=2, Gold=3
  progress: number;
  target: number;
  isEarned: boolean;
  earnedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Financial Literacy types
export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetAmount: string;
  currentAmount: string;
  deadline?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ExpenseCategory = 'FOOD' | 'ENTERTAINMENT' | 'EDUCATION' | 'TOYS' | 'CLOTHES' | 'GIFTS' | 'SAVINGS' | 'OTHER';

export interface Expense {
  id: string;
  userId: string;
  title: string;
  description?: string;
  amount: string;
  category: ExpenseCategory;
  date: Date;
  receiptUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// LIFF and LINE Integration types
export interface LIFFProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LIFFContext {
  type: 'utou' | 'room' | 'group' | 'none' | 'square_chat' | 'external';
  groupId?: string;
  roomId?: string;
  endpointUrl?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form and UI types
export interface CreateTaskForm {
  title: string;
  description?: string;
  instructions?: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  rewardAmount: number;
  estimatedTime?: number;
  assignedToId?: string;
  dueDate?: Date;
  priority: number;
  attachments?: File[];
  isRecurring: boolean;
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: Date;
  };
}

export interface SubmitTaskForm {
  taskId: string;
  photos: File[];
  notes?: string;
}

export interface ApproveTaskForm {
  submissionId: string;
  status: ApprovalStatus;
  comments?: string;
  rating?: number;
}

// Dashboard and Analytics types
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalRewards: string; // KAIA amount
  completionRate: number;
  currentStreak: number;
  weeklyProgress: {
    date: string;
    completed: number;
    assigned: number;
  }[];
}

export interface FamilyStats {
  totalMembers: number;
  activeChildren: number;
  totalTasksThisWeek: number;
  totalRewardsDistributed: string;
  topPerformer?: {
    userId: string;
    displayName: string;
    completedTasks: number;
  };
  categoryBreakdown: {
    category: TaskCategory;
    count: number;
    completion: number;
  }[];
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'REWARD_RECEIVED' | 'ACHIEVEMENT_EARNED' | 'REMINDER';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

// Component prop types
export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export interface ErrorProps extends BaseProps {
  error: Error | string;
  retry?: () => void;
}

// Hook return types
export interface UseLIFFReturn {
  liff: any;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: Error | null;
  profile: LIFFProfile | null;
  context: LIFFContext | null;
  login: () => Promise<void>;
  logout: () => void;
  sendMessage: (messages: any[]) => Promise<void>;
  shareTargetPicker: (messages: any[]) => Promise<void>;
}

export interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  createTask: (data: CreateTaskForm) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  submitTask: (data: SubmitTaskForm) => Promise<TaskSubmission>;
  approveTask: (data: ApproveTaskForm) => Promise<TaskApproval>;
  refreshTasks: () => Promise<void>;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredOnly<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

// Configuration types
export interface AppConfig {
  liffId: string;
  apiUrl: string;
  networkName: 'mainnet' | 'testnet';
  contracts: {
    rewards: string;
    familyPools: string;
  };
  aws: {
    region: string;
    bucket: string;
    cdnDomain: string;
  };
  features: {
    achievements: boolean;
    savingsGoals: boolean;
    expenseTracking: boolean;
    photoValidation: boolean;
  };
}