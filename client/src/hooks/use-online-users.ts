import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { realtimeDb, db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import { User } from '@shared/schema';

export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, appUser } = useAuth();

  // Firestore에서 사용자 프로필 정보 조회
  const fetchUserProfiles = useCallback(async (userIds: string[]): Promise<User[]> => {
    if (userIds.length === 0) return [];

    try {
      // 배치 크기 제한 (Firestore의 'in' 쿼리는 최대 10개까지)
      const batches = [];
      for (let i = 0; i < userIds.length; i += 10) {
        const batchIds = userIds.slice(i, i + 10);
        batches.push(batchIds);
      }

      const allUsers: User[] = [];
      
      for (const batchIds of batches) {
        const usersQuery = query(
          collection(db, 'users'),
          where('id', 'in', batchIds)
        );
        
        const querySnapshot = await getDocs(usersQuery);
        const batchUsers = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as User[];
        
        allUsers.push(...batchUsers);
      }

      return allUsers;
    } catch (err) {
      console.error('사용자 프로필 조회 오류:', err);
      return [];
    }
  }, []);

  // Firebase Realtime Database 실시간 구독
  useEffect(() => {
    if (!user || !appUser) {
      setOnlineUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const statusRef = ref(realtimeDb, 'status');
    
    const unsubscribe = onValue(statusRef, async (snapshot) => {
      try {
        const statusData = snapshot.val() || {};
        
        // 온라인 상태인 사용자들의 ID 추출 (현재 사용자 제외)
        const onlineUserIds = Object.entries(statusData)
          .filter(([userId, status]: [string, any]) => 
            status?.isOnline === true && 
            userId !== appUser.id
          )
          .map(([userId]) => userId);

        console.log('실시간 온라인 사용자 ID:', onlineUserIds);

        if (onlineUserIds.length === 0) {
          setOnlineUsers([]);
          setLoading(false);
          return;
        }

        // Firestore에서 사용자 프로필 정보 조회
        const userProfiles = await fetchUserProfiles(onlineUserIds);
        
        console.log('조회된 사용자 프로필:', userProfiles);
        
        setOnlineUsers(userProfiles);
        setError(null);
      } catch (err) {
        console.error('실시간 온라인 사용자 처리 오류:', err);
        setError('온라인 사용자 목록을 불러오는 중 오류가 발생했습니다.');
        setOnlineUsers([]);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Firebase Realtime Database 오류:', error);
      setError('실시간 데이터베이스 연결 오류가 발생했습니다.');
      setLoading(false);
    });

    // 컴포넌트 언마운트 시 구독 해제
    return unsubscribe;
  }, [user, appUser, fetchUserProfiles]);

  // 수동 새로고침 함수 (필요시 사용)
  const refresh = useCallback(() => {
    if (!user || !appUser) return;
    
    // 실시간 구독이므로 별도 새로고침 불필요
    // 하지만 기존 API와의 호환성을 위해 유지
    console.log('실시간 구독 중이므로 자동 새로고침됩니다.');
  }, [user, appUser]);

  return {
    onlineUsers,
    loading,
    error,
    refresh,
  };
}