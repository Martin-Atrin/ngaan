'use client';

import { useState } from 'react';
import { useLIFF } from '@/hooks/useLIFF';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function WelcomeScreen() {
  const { login, isLoading } = useLIFF();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading || isLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-line-green/10 to-kaia-primary/10">
        <LoadingSpinner size="lg" text="Connecting to LINE..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-line-green/10 to-kaia-primary/10 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto bg-primary rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">N</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Ngaan</h1>
          <p className="text-gray-600 text-lg">
            The family task manager that rewards responsibility with blockchain technology
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <div className="bg-white/80 backdrop-blur rounded-lg p-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">✓</span>
              </div>
              <div>
                <h3 className="font-semibold">Create & Assign Tasks</h3>
                <p className="text-sm text-gray-600">Parents create tasks, children complete them</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-lg p-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">📸</span>
              </div>
              <div>
                <h3 className="font-semibold">Photo Verification</h3>
                <p className="text-sm text-gray-600">Submit photos to prove task completion</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-lg p-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600">⚡</span>
              </div>
              <div>
                <h3 className="font-semibold">Instant KAIA Rewards</h3>
                <p className="text-sm text-gray-600">Earn cryptocurrency for completed tasks</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-lg p-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">🏆</span>
              </div>
              <div>
                <h3 className="font-semibold">Achievement System</h3>
                <p className="text-sm text-gray-600">Unlock badges and build good habits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full btn-primary py-3 text-lg font-semibold bg-line-green hover:bg-line-green/90 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <div className="flex items-center justify-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Connecting...</span>
              </div>
            ) : (
              'Get Started with LINE'
            )}
          </button>

          <p className="text-sm text-gray-500">
            By continuing, you agree to connect your LINE account with Ngaan
          </p>
        </div>

        {/* Beta Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-kaia-primary/10 text-kaia-primary text-sm font-medium">
          <span className="w-2 h-2 bg-kaia-primary rounded-full mr-2"></span>
          Beta Version
        </div>
      </div>
    </div>
  );
}