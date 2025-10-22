import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirestore, useFirestoreCollection } from "@/hooks/use-firebase";
import { useChat, useChatMessages } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { Chat, User, Match, Message } from "@shared/schema";
import { getAvatarSrc } from "@/utils/avatar";
import LoadingSpinner from "./LoadingSpinner";

interface ChatScreenProps {
  matchId?: string; // Optional for 1:1 chats
  chatRoomId?: string; // For 1:1 chats
  opponent?: User; // Made optional to prevent crashes when no opponent selected
  onBack: () => void;
}

export default function ChatScreen({ matchId, chatRoomId, opponent, onBack }: ChatScreenProps) {
  const { appUser } = useAuth();
  const { addDocument } = useFirestore();
  const { sendMessage } = useChat();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If no opponent provided, show placeholder screen
  if (!opponent) {
    return (
      <div className="container mx-auto max-w-md min-h-screen bg-background shadow-2xl flex flex-col">
        <header className="flex items-center justify-between p-4 bg-background border-b border-border">
          <Button variant="ghost" onClick={onBack} className="p-2" data-testid="button-chat-back">
            <i className="fas fa-arrow-left" />
          </Button>
          <h1 className="font-semibold">채팅</h1>
          <div className="w-10"></div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <i className="fas fa-user-slash text-4xl mb-4"></i>
            <p>채팅 상대를 선택해주세요</p>
          </div>
        </div>
      </div>
    );
  }

  // For 1:1 chats, use the new chat system
  const { messages: chatRoomMessages, loading: chatRoomLoading } = useChatMessages(chatRoomId || null);

  // For legacy match-based chats, use the old system
  const {
    data: rawMatchMessages,
    loading: matchMessagesLoading,
    error: messagesError
  } = useFirestoreCollection<Chat>('chats', matchId ? [
    { field: 'matchId', operator: '==', value: matchId }
  ] : []);

  // Determine which messages to use
  const isNewChatSystem = !!chatRoomId;
  const messages = isNewChatSystem 
    ? chatRoomMessages 
    : [...rawMatchMessages].sort((a, b) => {
        const timeA = a.createdAt ? +new Date(a.createdAt) : Infinity;
        const timeB = b.createdAt ? +new Date(b.createdAt) : Infinity;
        return timeA - timeB;
      });

  const messagesLoading = isNewChatSystem ? chatRoomLoading : matchMessagesLoading;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !appUser || isSending) return;
    
    setIsSending(true);
    try {
      if (isNewChatSystem && chatRoomId) {
        // Use new chat system
        await sendMessage(chatRoomId, message.trim());
      } else if (matchId) {
        // Use legacy match-based chat system
        await addDocument('chats', {
          matchId,
          senderId: appUser.id,
          message: message.trim()
        });
      }
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="chat-screen">
      {/* Chat Header */}
      <header className="bg-background border-b border-border p-4 flex items-center space-x-3">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground" data-testid="button-chat-back">
          <i className="fas fa-arrow-left text-lg" />
        </Button>
        <img 
          src={getAvatarSrc(opponent.photoURL, opponent, 80)} 
          alt={opponent.username} 
          className="w-10 h-10 rounded-full object-cover"
          data-testid="img-chat-partner"
        />
        <div className="flex-1">
          <h2 className="font-semibold text-foreground" data-testid="text-chat-partner-name">{opponent.username}</h2>
          <p className="text-xs text-muted-foreground">NTRP {opponent.ntrp} • {opponent.region}</p>
        </div>
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="button-chat-menu">
          <i className="fas fa-ellipsis-v" />
        </Button>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted">
        {messagesError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-destructive mb-4"></i>
            <p className="text-destructive mb-2">채팅을 불러올 수 없습니다</p>
            <p className="text-sm text-muted-foreground">
              인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요.
            </p>
          </div>
        ) : messagesLoading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <i className="fas fa-comments text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground mb-2">대화를 시작해보세요!</p>
            <p className="text-sm text-muted-foreground">
              {opponent.username}님과 매치 일정을 조율하거나 인사를 나누어보세요.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isSent = msg.senderId === appUser?.id;
              return (
                <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`px-4 py-2 rounded-2xl max-w-xs chat-bubble-animation ${
                      isSent 
                        ? 'bg-primary text-primary-foreground rounded-br-sm' 
                        : 'bg-background border border-border rounded-bl-sm'
                    }`}
                    data-testid={isSent ? 'message-sent' : 'message-received'}
                  >
                    <p className="break-words">
                      {isNewChatSystem 
                        ? (msg as Message).content 
                        : (msg as Chat).message}
                    </p>
                    {msg.createdAt && (
                      <p className={`text-xs mt-1 ${isSent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      {/* Chat Input */}
      <div className="bg-background border-t border-border p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="메시지를 입력하세요..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isSending}
              className="w-full p-3 border border-input rounded-full bg-muted focus:ring-2 focus:ring-ring focus:border-transparent pr-12"
              data-testid="input-chat-message"
            />
            <Button variant="ghost" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground" data-testid="button-chat-attach">
              <i className="fas fa-paperclip" />
            </Button>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className="bg-primary text-primary-foreground p-3 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
            data-testid="button-send-message"
          >
            {isSending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <i className="fas fa-paper-plane" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
