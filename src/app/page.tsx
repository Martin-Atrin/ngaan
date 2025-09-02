'use client';

import { useEffect, useState } from 'react';
import { useLIFF } from '@/hooks/useLIFF';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { Dashboard } from '@/components/dashboard/Dashboard';

export default function HomePage() {
  const { liff, isLoggedIn, isLoading, error, profile } = useLIFF();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (liff && !isLoading) {
      setIsInitialized(true);
    }
  }, [liff, isLoading]);

  // Show loading state while LIFF is initializing
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-line-green/10 to-kaia-primary/10">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <h1 className="text-2xl font-bold text-primary">Ngaan</h1>
          <p className="text-muted-foreground">Loading your family dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if LIFF fails to initialize
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Connection Error</h1>
          <p className="text-gray-600">
            Unable to connect to LINE. Please make sure you're opening this app from within LINE.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show welcome screen for new users
  if (!isLoggedIn) {
    return <WelcomeScreen />;
  }

  // Show main dashboard for authenticated users
  return <Dashboard />;
}