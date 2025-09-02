'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { LIFFProfile, LIFFContext } from '@/types';

interface LIFFContextType {
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

const LIFFContext = createContext<LIFFContextType | undefined>(undefined);

export function LIFFProvider({ children }: { children: React.ReactNode }) {
  const [liff, setLiff] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [profile, setProfile] = useState<LIFFProfile | null>(null);
  const [context, setContext] = useState<LIFFContext | null>(null);

  useEffect(() => {
    const initLIFF = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { default: liffSDK } = await import('@line/liff');
        
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          throw new Error('LIFF ID is not configured');
        }

        // Initialize LIFF
        await liffSDK.init({ liffId });
        setLiff(liffSDK);

        // Check login status
        const loggedIn = liffSDK.isLoggedIn();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          // Get user profile
          const userProfile = await liffSDK.getProfile();
          setProfile({
            userId: userProfile.userId,
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl,
            statusMessage: userProfile.statusMessage,
          });

          // Get LIFF context
          const liffContext = liffSDK.getContext();
          if (liffContext) {
            setContext({
              type: liffContext.type,
              groupId: liffContext.groupId,
              roomId: liffContext.roomId,
              endpointUrl: liffContext.endpointUrl,
            });
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('LIFF initialization failed:', err);
        setError(err instanceof Error ? err : new Error('LIFF initialization failed'));
        setIsLoading(false);
      }
    };

    initLIFF();
  }, []);

  const login = async () => {
    if (!liff) throw new Error('LIFF is not initialized');
    
    try {
      if (!liff.isLoggedIn()) {
        liff.login();
      }
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  const logout = () => {
    if (!liff) return;
    
    try {
      liff.logout();
      setIsLoggedIn(false);
      setProfile(null);
      setContext(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const sendMessage = async (messages: any[]) => {
    if (!liff) throw new Error('LIFF is not initialized');
    
    try {
      if (liff.isApiAvailable('sendMessages')) {
        await liff.sendMessages(messages);
      } else {
        console.warn('sendMessages API is not available');
      }
    } catch (err) {
      console.error('Send message failed:', err);
      throw err;
    }
  };

  const shareTargetPicker = async (messages: any[]) => {
    if (!liff) throw new Error('LIFF is not initialized');
    
    try {
      if (liff.isApiAvailable('shareTargetPicker')) {
        await liff.shareTargetPicker(messages);
      } else {
        console.warn('shareTargetPicker API is not available');
      }
    } catch (err) {
      console.error('Share target picker failed:', err);
      throw err;
    }
  };

  const value = {
    liff,
    isLoggedIn,
    isLoading,
    error,
    profile,
    context,
    login,
    logout,
    sendMessage,
    shareTargetPicker,
  };

  return <LIFFContext.Provider value={value}>{children}</LIFFContext.Provider>;
}

export const useLIFF = () => {
  const context = useContext(LIFFContext);
  if (context === undefined) {
    throw new Error('useLIFF must be used within a LIFFProvider');
  }
  return context;
};