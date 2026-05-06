import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useStore } from '@/store';
import { syncAllUserData } from '@/lib/sync/syncService';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const authUser = useStore((s) => s.authUser);
  const setSyncStatus = useStore((s) => s.setSyncStatus);
  const syncStatus = useStore((s) => s.syncStatus);
  
  const isOnlineRef = useRef(true);

  useEffect(() => {
    // Network listener
    const unsubscribeNet = NetInfo.addEventListener(state => {
      isOnlineRef.current = !!state.isConnected && !!state.isInternetReachable;
      if (!isOnlineRef.current) {
        setSyncStatus('idle'); // Offline — stay idle, don't attempt sync
      } else if (syncStatus === 'idle') {
        // Network restored — trigger sync if authenticated
        if (authUser) {
          syncAllUserData(authUser.id);
        }
      }
    });

    // App State listener (background to foreground)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && authUser && isOnlineRef.current) {
        syncAllUserData(authUser.id);
      }
    };
    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubscribeNet();
      appStateSub.remove();
    };
  }, [authUser, syncStatus, setSyncStatus]);

  // Initial Sync on auth user change
  useEffect(() => {
    if (authUser && isOnlineRef.current) {
      syncAllUserData(authUser.id);
    }
  }, [authUser]);

  return <>{children}</>;
}
