'use client';

import { useEffect, useState } from 'react';
import { useLIFF } from '@/hooks/useLIFF';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function Dashboard() {
  const { profile } = useLIFF();
  const [userRole, setUserRole] = useState<'parent' | 'child' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch user data from API to determine role
    // For now, we'll show a role selection screen
    setIsLoading(false);
  }, [profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  if (!userRole) {
    return <RoleSelection onRoleSelect={setUserRole} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {userRole === 'parent' ? <ParentDashboard /> : <ChildDashboard />}
    </div>
  );
}

function RoleSelection({ onRoleSelect }: { onRoleSelect: (role: 'parent' | 'child') => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-line-green/10 to-kaia-primary/10 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to your family!</h1>
          <p className="text-gray-600">
            Let's set up your account. Are you a parent managing tasks or a child completing them?
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onRoleSelect('parent')}
            className="w-full p-6 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-primary rounded-xl transition-all duration-200 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-lg">I'm a Parent</h3>
                <p className="text-gray-600 text-sm">Create tasks, manage family, and approve completions</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onRoleSelect('child')}
            className="w-full p-6 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-primary rounded-xl transition-all duration-200 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="text-2xl">🧒</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-lg">I'm a Child</h3>
                <p className="text-gray-600 text-sm">Complete tasks, earn rewards, and track progress</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function ParentDashboard() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Dashboard</h1>
          <p className="text-gray-600">Manage your family's tasks and rewards</p>
        </div>
        <button className="btn-primary">
          + Create Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">12</div>
          <div className="text-sm text-gray-600">Active Tasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">8</div>
          <div className="text-sm text-gray-600">Completed This Week</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">145</div>
          <div className="text-sm text-gray-600">KAIA Distributed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">85%</div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <div className="font-medium">Kitchen cleaned</div>
              <div className="text-sm text-gray-600">Completed by Sarah • 2 hours ago</div>
            </div>
            <div className="text-green-600 font-medium">+5 KAIA</div>
          </div>
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div>
              <div className="font-medium">Math homework</div>
              <div className="text-sm text-gray-600">Submitted by Alex • Pending review</div>
            </div>
            <div className="text-yellow-600 font-medium">Review</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChildDashboard() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <div className="flex items-center justify-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-kaia-primary">85</span> KAIA earned
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-orange-500">7</span> day streak
          </div>
        </div>
      </div>

      {/* Progress Ring */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - 0.75)}`}
              className="text-primary"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">75%</div>
              <div className="text-xs text-gray-600">Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <div className="task-card">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Clean bedroom</h3>
              <span className="badge badge-warning">Due today</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Make bed, organize desk, vacuum floor</p>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Reward: 3 KAIA</div>
              <button className="btn-primary btn-sm">Start Task</button>
            </div>
          </div>
        </div>

        <div className="task-card completed">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Take out trash</h3>
              <span className="badge badge-success">Completed</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Empty all wastebaskets and take to curb</p>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Reward: 2 KAIA</div>
              <div className="text-sm text-green-600 font-medium">✓ Earned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <button className="bg-primary text-white rounded-full p-4 shadow-lg">
          <span className="text-xl">📸</span>
        </button>
      </div>
    </div>
  );
}