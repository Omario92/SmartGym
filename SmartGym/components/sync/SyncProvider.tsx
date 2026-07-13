import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useStore } from '@/store';
import { syncAllUserData } from '@/lib/sync/syncService';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const authUser = useStore((s) => s.authUser);
  const isOnlineRef = useRef(true);

  useEffect(() => {
    if (!authUser) return;

    // Network listener
    const unsubscribeNet = NetInfo.addEventListener(state => {
      isOnlineRef.current = !!state.isConnected && !!state.isInternetReachable;
      const currentStatus = useStore.getState().syncStatus;
      
      if (!isOnlineRef.current) {
        useStore.getState().setSyncStatus('idle'); // Offline — stay idle, don't attempt sync
      } else if (currentStatus === 'idle') {
        // Network restored — trigger sync if authenticated
        syncAllUserData(authUser.id);
      }
    });

    // App State listener (background to foreground)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isOnlineRef.current) {
        syncAllUserData(authUser.id);
      }
    };
    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubscribeNet();
      appStateSub.remove();
    };
  }, [authUser]);

  // Initial Sync on auth user change
  useEffect(() => {
    if (authUser && isOnlineRef.current) {
      syncAllUserData(authUser.id);
    }
  }, [authUser]);

  return <>{children}</>;
}
