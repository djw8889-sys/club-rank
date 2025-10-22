import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Trophy, MapPin, Star, Target } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  username: string;
  photoURL: string | null;
  ntrp: string;
  region: string;
  mannerScore: number;
  wins: number;
  losses: number;
  points: number;
  bio: string | null;
  tier: string | null;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onStartChat?: (userId: string) => void;
}

export default function UserProfileModal({ isOpen, onClose, userId, onStartChat }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // 사용자 프로필 정보 가져오기
  useEffect(() => {
    if (!isOpen || !userId || !user) {
      setProfile(null);
      setIsOwnProfile(false);
      return;
    }

    fetchUserProfile();
  }, [isOpen, userId, user]);

  const fetchUserProfile = async () => {
    if (!userId || !user) return;

    setLoading(true);
    try {
      // Firebase Auth 토큰 가져오기
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('프로필 정보를 가져올 수 없습니다.');
      }

      const data = await response.json();
      setProfile(data.profile);
      setIsOwnProfile(data.isOwnProfile);
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast({
        title: "프로필 로드 실패",
        description: "사용자 프로필 정보를 불러올 수 없습니다.",
        variant: "destructive",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleFriendRequest = async () => {
    if (!userId || !user || isOwnProfile) return;

    setFriendRequestLoading(true);
    try {
      // Firebase Auth 토큰 가져오기
      const token = await user.getIdToken();
      
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '친구 요청을 보낼 수 없습니다.');
      }

      toast({
        title: "친구 요청 성공",
        description: `${profile?.username}님에게 친구 요청을 보냈습니다.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Friend request error:', error);
      toast({
        title: "친구 요청 실패",
        description: error instanceof Error ? error.message : "친구 요청을 보낼 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setFriendRequestLoading(false);
    }
  };

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case 'Bronze': return 'bg-amber-600';
      case 'Silver': return 'bg-gray-400';
      case 'Gold': return 'bg-yellow-500';
      case 'Platinum': return 'bg-cyan-500';
      case 'Diamond': return 'bg-blue-600';
      default: return 'bg-gray-500';
    }
  };

  const getWinRate = () => {
    if (!profile) return 0;
    const totalGames = profile.wins + profile.losses;
    return totalGames > 0 ? Math.round((profile.wins / totalGames) * 100) : 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto" data-testid="modal-user-profile">
        <DialogHeader>
          <DialogTitle className="text-center">사용자 프로필</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* 프로필 헤더 */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.photoURL || ''} alt={profile.username} />
                <AvatarFallback className="text-2xl">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold" data-testid="text-profile-username">{profile.username}</h3>
                
                <div className="flex items-center justify-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.region}</span>
                </div>

                {profile.tier && (
                  <Badge className={`${getTierColor(profile.tier)} text-white`}>
                    <Trophy className="h-3 w-3 mr-1" />
                    {profile.tier}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="flex flex-col items-center p-4">
                  <Target className="h-5 w-5 text-primary mb-2" />
                  <div className="text-center">
                    <div className="text-2xl font-bold">{profile.ntrp}</div>
                    <div className="text-xs text-muted-foreground">NTRP</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col items-center p-4">
                  <Star className="h-5 w-5 text-yellow-500 mb-2" />
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(profile.mannerScore ?? 5).toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">매너점수</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 전적 정보 */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 text-center">전적</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-green-600">{profile.wins}</div>
                    <div className="text-xs text-muted-foreground">승리</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-red-600">{profile.losses}</div>
                    <div className="text-xs text-muted-foreground">패배</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{getWinRate()}%</div>
                    <div className="text-xs text-muted-foreground">승률</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 포인트 */}
            <Card>
              <CardContent className="flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{profile.points.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">보유 포인트</div>
                </div>
              </CardContent>
            </Card>

            {/* 소개 */}
            {profile.bio && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">소개</h4>
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* 액션 버튼들 */}
            {!isOwnProfile && (
              <div className="space-y-3">
                {/* 1:1 채팅 신청하기 버튼 */}
                <Button 
                  onClick={() => {
                    if (userId && onStartChat) {
                      onStartChat(userId);
                      onClose();
                    }
                  }}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                  data-testid="button-start-chat"
                >
                  <i className="fas fa-comments mr-2" />
                  1:1 채팅 신청하기
                </Button>
                
                {/* 친구 추가 버튼 */}
                <Button 
                  onClick={handleFriendRequest}
                  disabled={friendRequestLoading}
                  className="w-full"
                  size="lg"
                  variant="outline"
                  data-testid="button-friend-request"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {friendRequestLoading ? '요청 중...' : '+ 친구 추가'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">프로필을 불러올 수 없습니다.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}