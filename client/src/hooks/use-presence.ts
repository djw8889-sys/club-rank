import { useEffect, useState } from 'react';
import { ref, set, onValue, onDisconnect, serverTimestamp, push, off } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { useAuth } from './use-auth';

interface UserPresence {
  isOnline: boolean;
  lastChanged: any;
  userId: string;
  username?: string;
  photoURL?: string;
}

export function usePresence() {
  const { user, appUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);

  useEffect(() => {
    if (!user || !appUser) return;

    const userStatusRef = ref(realtimeDb, `/status/${user.uid}`);
    const isOfflineForDatabase = {
      isOnline: false,
      lastChanged: serverTimestamp(),
    };

    const isOnlineForDatabase = {
      isOnline: true,
      lastChanged: serverTimestamp(),
      userId: user.uid,
      username: appUser.username,
      photoURL: appUser.photoURL,
    };

    // Firebase의 .info/connected 경로를 사용하여 연결 상태 감지
    const connectedRef = ref(realtimeDb, '.info/connected');
    
    const unsubscribeConnection = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        // 연결되었을 때
        set(userStatusRef, isOnlineForDatabase);
        
        // 연결이 끊어졌을 때 자동으로 오프라인으로 설정
        onDisconnect(userStatusRef).set(isOfflineForDatabase);
      }
    });

    // 모든 사용자의 접속 상태 실시간 구독
    const statusRef = ref(realtimeDb, '/status');
    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      const statusData = snapshot.val();
      if (statusData) {
        const onlineUsersList: UserPresence[] = [];
        Object.keys(statusData).forEach((userId) => {
          const userStatus = statusData[userId];
          if (userStatus.isOnline && userId !== user.uid) {
            onlineUsersList.push({
              ...userStatus,
              userId,
            });
          }
        });
        setOnlineUsers(onlineUsersList);
      } else {
        setOnlineUsers([]);
      }
    });

    // 컴포넌트 언마운트 시 정리
    return () => {
      unsubscribeConnection();
      unsubscribeStatus();
      // 명시적으로 오프라인 상태로 설정
      set(userStatusRef, isOfflineForDatabase);
    };
  }, [user, appUser]);

  return {
    onlineUsers,
    isConnected: user && appUser ? true : false,
  };
}