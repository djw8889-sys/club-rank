import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import { ChatRoom, Message, InsertMessage, InsertChatRoom } from '@shared/schema';

export function useChat() {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);

  // 사용자의 채팅방 목록 실시간 구독
  useEffect(() => {
    if (!user) return;

    const chatRoomsQuery = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(chatRoomsQuery, (snapshot) => {
      const rooms: ChatRoom[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastMessageAt: doc.data().lastMessageAt?.toDate() || undefined,
      } as ChatRoom));
      
      // Sort on client side to avoid composite index requirement
      const sortedRooms = rooms.sort((a, b) => {
        const timeA = a.updatedAt ? a.updatedAt.getTime() : 0;
        const timeB = b.updatedAt ? b.updatedAt.getTime() : 0;
        return timeB - timeA; // Descending order
      });
      
      setChatRooms(sortedRooms);
    });

    return () => unsubscribe();
  }, [user]);

  // 1:1 채팅방 생성 또는 기존 채팅방 찾기
  const createOrFindChatRoom = async (otherUserId: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      // 기존 채팅방이 있는지 확인
      const existingRoomQuery = query(
        collection(db, 'chatRooms'),
        where('participants', '==', [user.uid, otherUserId].sort())
      );
      
      const existingRoomSnapshot = await getDocs(existingRoomQuery);
      
      if (!existingRoomSnapshot.empty) {
        return existingRoomSnapshot.docs[0].id;
      }

      // 새 채팅방 생성
      const newRoomData: InsertChatRoom = {
        participants: [user.uid, otherUserId].sort(),
      };

      const docRef = await addDoc(collection(db, 'chatRooms'), {
        ...newRoomData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } finally {
      setLoading(false);
    }
  };

  // 메시지 전송
  const sendMessage = async (chatRoomId: string, content: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    const messageData: InsertMessage = {
      chatRoomId,
      senderId: user.uid,
      content: content.trim(),
    };

    // 메시지 추가
    await addDoc(collection(db, 'messages'), {
      ...messageData,
      createdAt: serverTimestamp(),
    });

    // 채팅방의 lastMessage와 lastMessageAt 업데이트
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    await updateDoc(chatRoomRef, {
      lastMessage: content.trim(),
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  return {
    chatRooms,
    loading,
    createOrFindChatRoom,
    sendMessage,
  };
}

// 특정 채팅방의 메시지들을 실시간으로 구독하는 hook
export function useChatMessages(chatRoomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chatRoomId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', chatRoomId)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as Message));
      
      // Sort on client side to avoid composite index requirement
      const sortedMessages = messageList.sort((a, b) => {
        const timeA = a.createdAt ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt ? b.createdAt.getTime() : 0;
        return timeA - timeB; // Ascending order
      });
      
      setMessages(sortedMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatRoomId]);

  return { messages, loading };
}