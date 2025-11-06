import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { increment } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useFirestoreCollection, useFirestore } from "@/hooks/use-firebase";
import { useChat } from "@/hooks/use-chat";
import { User, Post, Match } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { calculateTier, getTierProgress } from "@/utils/tierCalculator";
import { getAvatarSrc } from "@/utils/avatar";
import BottomNavigation from "./BottomNavigation";
import LoadingSpinner from "./LoadingSpinner";
import PostCreateModal from "./PostCreateModal";
import ChatScreen from "./ChatScreen";
import TierProgressCard from "./TierProgressCard";
import AdminPanel from "./AdminPanel";
import AdminPromotion from "./AdminPromotion";
import FeedbackModal from "./FeedbackModal";
import ClubRankLogo from "./ClubRankLogo";
import ProfileEditModal from "./ProfileEditModal";
import PointChargeModal from "./PointChargeModal";
import ShopModal from "./ShopModal";
import UserProfileModal from "./UserProfileModal";
import MyClubTabContent from "./MyClubTabContent";
import { useMyClubMembership } from "@/hooks/use-clubs";

export default function MainApp() {
  const { appUser, logout } = useAuth();
  const { deleteDocument, toggleLike, addComment } = useFirestore();
  const { createOrFindChatRoom, chatRooms } = useChat();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('my-club-tab');
  const [mainHeader, setMainHeader] = useState('내 클럽');
  
  // 탭 ID와 헤더 매핑
  const tabConfig = {
    'my-club-tab': '내 클럽',
    'ranking-tab': '랭킹',
    'community-tab': '커뮤니티',
    'my-info-tab': '내 정보'
  };
  
  // URL에서 탭 추출 (hash 기반)
  const getTabFromUrl = (): string => {
    const hash = window.location.hash.slice(1); // # 제거
    return hash && Object.keys(tabConfig).includes(hash) ? hash : 'my-club-tab';
  };
  
  // URL 초기화 및 브라우저 뒤로/앞으로 지원
  useEffect(() => {
    const handleHashChange = () => {
      const tabFromUrl = getTabFromUrl();
      setActiveTab(tabFromUrl);
      setMainHeader(tabConfig[tabFromUrl as keyof typeof tabConfig]);
    };
    
    // 초기 로드 시 URL에서 탭 설정
    handleHashChange();
    
    // 브라우저 뒤로/앞으로 버튼 지원
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showChatScreen, setShowChatScreen] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showPointChargeModal, setShowPointChargeModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{[postId: string]: string}>({});
  const [showComments, setShowComments] = useState<{[postId: string]: boolean}>({});

  // Fetch ranking data (all users sorted by points) - used for community posts
  const {
    data: rankingUsers,
    loading: rankingLoading
  } = useFirestoreCollection<User>('users', [], 'points', 'desc');

  // Fetch community posts
  const {
    data: posts,
    loading: postsLoading
  } = useFirestoreCollection<Post>('posts', [], 'createdAt', 'desc');

  // Fetch user's club matches for club statistics
  const { data: clubMemberships = [] } = useMyClubMembership();
  const userClubIds = Array.isArray(clubMemberships) 
    ? clubMemberships.filter(m => m?.club?.id).map(m => m.club.id)
    : [];
  
  // Fetch actual club statistics from API
  const { data: clubStats, isLoading: clubStatsLoading } = useQuery({
    queryKey: ['user-club-stats', appUser?.id, userClubIds],
    queryFn: async () => {
      if (!appUser?.id || userClubIds.length === 0) return null;
      
      const response = await fetch(`/api/clubs/${userClubIds[0]}/user/${appUser.id}/stats`);
      
      if (!response.ok) throw new Error('Failed to fetch club stats');
      return response.json();
    },
    enabled: !!appUser?.id && userClubIds.length > 0
  });

  // Calculate actual club statistics from real data
  const clubMatchesWins = clubStats?.statsByFormat ? 
    Object.values(clubStats.statsByFormat).reduce((sum: number, stats: any) => sum + (stats.wins || 0), 0) : 0;
  const clubMatchesLosses = clubStats?.statsByFormat ? 
    Object.values(clubStats.statsByFormat).reduce((sum: number, stats: any) => sum + (stats.losses || 0), 0) : 0;
  const clubMeetingsAttended = clubStats?.totalMatches || 0;
  const clubMeetingsMissed = Math.max(0, Math.floor(clubMeetingsAttended / 4)); // Estimate based on activity

  const handleTabChange = (tab: string, header: string) => {
    setActiveTab(tab);
    setMainHeader(header);
    // URL 업데이트 (hash 사용)
    window.location.hash = tab;
  };

  const handleDeletePost = async (postId: string, authorId: string) => {
    if (!appUser) return;
    
    // Check if current user is the author
    if (appUser.id !== authorId) {
      toast({
        title: "삭제 권한 없음",
        description: "본인이 작성한 글만 삭제할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteDocument('posts', postId);
      toast({
        title: "게시글 삭제 완료",
        description: "게시글이 성공적으로 삭제되었습니다.",
      });
    } catch (error: any) {
      console.error("Delete post error:", error);
      toast({
        title: "게시글 삭제 실패",
        description: error.message || "다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!appUser) return;
    
    try {
      await toggleLike(postId);
    } catch (error: any) {
      console.error("Toggle like error:", error);
      toast({
        title: "좋아요 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!appUser) return;
    
    const commentContent = commentInputs[postId]?.trim();
    if (!commentContent) return;
    
    try {
      await addComment(postId, commentContent);
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      toast({
        title: "댓글 작성 완료",
        description: "댓글이 성공적으로 작성되었습니다.",
      });
    } catch (error: any) {
      console.error("Add comment error:", error);
      toast({
        title: "댓글 작성 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const toggleCommentSection = (postId: string) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const updateCommentInput = (postId: string, value: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await logout();
    }
  };

  const handleNewPost = () => {
    setShowPostModal(true);
  };

  const handleClosePostModal = () => {
    setShowPostModal(false);
  };

  const handlePostCreated = () => {
    // Firestore의 realtime listener가 자동으로 UI를 업데이트함
    toast({
      title: "게시글이 추가되었습니다",
      description: "커뮤니티에서 확인해보세요!",
    });
  };

  // 사용자 프로필 클릭 핸들러
  const handleUserProfileClick = (userId: string) => {
    if (userId && userId !== appUser?.id) {
      setSelectedUserId(userId);
      setShowUserProfileModal(true);
    }
  };

  // 사용자 프로필 모달 닫기 핸들러
  const handleCloseUserProfileModal = () => {
    setShowUserProfileModal(false);
    setSelectedUserId(null);
  };



  if (!appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" data-testid="main-app">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-20">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center space-x-3">
            <ClubRankLogo size="sm" className="bg-transparent" />
            <h1 className="text-xl font-bold text-foreground" data-testid="text-main-header">
              {mainHeader}
            </h1>
            <span className="premium-badge">PREMIUM</span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowShopModal(true)}
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" 
              data-testid="button-shop"
            >
              <i className="fas fa-store text-lg" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </button>
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-notifications">
              <i className="fas fa-bell text-lg" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
            </button>
            <div className="text-right">
              <p className="font-bold text-accent flex items-center" data-testid="text-user-points">
                <i className="fas fa-coins mr-1" />
                <span>{appUser.points}</span> P
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto bg-muted">
        {/* Online Players Tab */}
        {/* My Club Tab */}
        <div className={`tab-content ${activeTab === 'my-club-tab' ? 'active' : 'hidden'}`}>
          <MyClubTabContent />
        </div>

        {/* Individual Matching Tab - REMOVED */}
        {/* Club Search Tab */}
        <div className={`tab-content ${activeTab === 'club-search-tab' ? 'active' : 'hidden'}`}>
          <div className="bg-gradient-to-r from-primary to-emerald-600 p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">🛡️ 클럽 찾기</h2>
            <p className="opacity-90">다른 클럽과 교류전을 신청하세요</p>
          </div>
          
          {/* Search Functionality */}
          <div className="p-4">
            <div className="bg-background rounded-xl p-6 text-center border border-border">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">클럽 검색 기능 준비 중</h3>
              <p className="text-muted-foreground mb-4">
                지역별 클럽 검색, 클럽 프로필 보기,<br />
                교류전 신청 기능이 곧 추가될 예정입니다.
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                <i className="fas fa-clock mr-2" />
                2025년 상반기 오픈 예정
              </div>
            </div>
          </div>
        </div>


        {/* Ranking Tab - Club Rankings Only */}
        <div className={`tab-content ${activeTab === 'ranking-tab' ? 'active' : 'hidden'}`}>
          {/* 랭킹 탭 헤더 */}
          <div className="bg-gradient-to-r from-primary to-emerald-600 p-4 text-white">
            <h2 className="text-lg font-bold mb-2">🏆 클럽 랭킹</h2>
            <div className="text-sm opacity-90">
              <p>이번 주 <span className="font-bold">최강 클럽</span>은?</p>
              <p>클럽 간 교류전으로 랭킹을 올려보세요!</p>
            </div>
          </div>

          {/* 클럽 랭킹 콘텐츠 */}
          <div className="p-4">
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <i className="fas fa-shield-alt text-2xl text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2" data-testid="text-club-ranking-coming-soon">클럽 랭킹 준비 중</h3>
                <p className="text-sm text-muted-foreground">
                  클럽 간 교류전 기능이 완성되면<br />
                  클럽 랭킹을 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Community Tab */}
        <div className={`tab-content ${activeTab === 'community-tab' ? 'active' : 'hidden'}`}>
          <div className="p-4 border-b border-border bg-background">
            <button 
              onClick={handleNewPost}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors" 
              data-testid="button-new-post"
            >
              <i className="fas fa-pen mr-2" />
              새 글 작성하기
            </button>
          </div>
          <div className="p-4">
            {postsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-muted-foreground text-sm">커뮤니티 게시글을 불러오는 중...</p>
              </div>
            ) : posts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8" data-testid="text-no-posts">
                아직 커뮤니티 게시글이 없습니다.<br />
                첫 번째 게시글을 작성해보세요!
              </p>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => {
                  // 작성자 정보 찾기
                  const author = rankingUsers.find(user => user.id === post.authorId) || 
                    (post.authorId === appUser?.id ? appUser : null);
                  
                  return (
                    <div 
                      key={post.id}
                      className="bg-background rounded-xl p-4 border border-border hover:bg-muted transition-colors"
                      data-testid={`post-${post.id}`}
                    >
                      {/* Post Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <img 
                          src={getAvatarSrc(author?.photoURL, author, 80)} 
                          alt={author?.username || "Unknown"} 
                          className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => author?.id && handleUserProfileClick(author.id)}
                        />
                        <div className="flex-1">
                          <p 
                            className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors" 
                            data-testid={`text-post-author-${post.id}`}
                            onClick={() => author?.id && handleUserProfileClick(author.id)}
                          >
                            {author?.username || "Unknown User"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {post.createdAt && new Date(post.createdAt).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {/* Delete button for post author */}
                        {appUser?.id === post.authorId && (
                          <button
                            onClick={() => handleDeletePost(post.id, post.authorId)}
                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                            data-testid={`button-delete-post-${post.id}`}
                            title="게시글 삭제"
                          >
                            <i className="fas fa-trash text-sm" />
                          </button>
                        )}
                      </div>
                      
                      {/* Post Content */}
                      <div className="mb-3">
                        <h3 className="font-bold text-foreground mb-2" data-testid={`text-post-title-${post.id}`}>
                          {post.title}
                        </h3>
                        <p className="text-foreground whitespace-pre-wrap" data-testid={`text-post-content-${post.id}`}>
                          {post.content}
                        </p>
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex items-center space-x-4 pt-2 border-t border-border">
                        <button 
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center space-x-1 transition-colors ${
                            (Array.isArray(post.likes) ? post.likes : []).includes(appUser?.id || '') 
                              ? 'text-red-500 hover:text-red-600' 
                              : 'text-muted-foreground hover:text-red-500'
                          }`}
                          data-testid={`button-like-post-${post.id}`}
                        >
                          <i className={`${(Array.isArray(post.likes) ? post.likes : []).includes(appUser?.id || '') ? 'fas' : 'far'} fa-heart`} />
                          <span className="text-sm" data-testid={`text-post-likes-${post.id}`}>
                            {Array.isArray(post.likes) ? post.likes.length : (typeof post.likes === 'number' ? post.likes : 0)}
                          </span>
                        </button>
                        <button 
                          onClick={() => toggleCommentSection(post.id)}
                          className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                          data-testid={`button-comment-post-${post.id}`}
                        >
                          <i className="far fa-comment" />
                          <span className="text-sm">댓글 {(post.comments || []).length}</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      {showComments[post.id] && (
                        <div className="mt-4 pt-4 border-t border-border">
                          {/* Existing Comments */}
                          {(post.comments || []).length > 0 && (
                            <div className="space-y-3 mb-4">
                              {post.comments.map((comment) => {
                                const commentAuthor = rankingUsers.find(user => user.id === comment.authorId) || 
                                  (comment.authorId === appUser?.id ? appUser : null);
                                
                                return (
                                  <div key={comment.id} className="flex space-x-3" data-testid={`comment-${comment.id}`}>
                                    <img 
                                      src={getAvatarSrc(commentAuthor?.photoURL, commentAuthor, 64)} 
                                      alt={commentAuthor?.username || "Unknown"} 
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                      <div className="bg-muted rounded-lg px-3 py-2">
                                        <p className="font-semibold text-sm text-foreground">
                                          {commentAuthor?.username || "Unknown User"}
                                        </p>
                                        <p className="text-sm text-foreground" data-testid={`text-comment-content-${comment.id}`}>
                                          {comment.content}
                                        </p>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1 ml-3">
                                        {comment.createdAt && (comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt)).toLocaleDateString('ko-KR', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Comment Input */}
                          <div className="flex space-x-3">
                            <img 
                              src={getAvatarSrc(appUser?.photoURL, appUser, 64)} 
                              alt={appUser?.username || "User"} 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1 flex space-x-2">
                              <input
                                type="text"
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => updateCommentInput(post.id, e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(post.id);
                                  }
                                }}
                                placeholder="댓글을 입력하세요..."
                                className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                data-testid={`input-comment-${post.id}`}
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                disabled={!commentInputs[post.id]?.trim()}
                                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                data-testid={`button-submit-comment-${post.id}`}
                              >
                                <i className="fas fa-paper-plane" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Profile Tab */}
        {/* My Info Tab */}
        <div className={`tab-content ${activeTab === 'my-info-tab' ? 'active' : 'hidden'}`}>
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary to-emerald-600 p-6 text-white">
            <div className="flex items-center space-x-4">
              <img 
                src={getAvatarSrc(appUser.photoURL, appUser, 160)} 
                alt="User profile" 
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                data-testid="img-user-profile"
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold" data-testid="text-user-name">{appUser.username}</h2>
                <p className="opacity-90" data-testid="text-user-info">NTRP {appUser.ntrp} • {appUser.region}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <span data-testid="text-user-record">{appUser.wins}승 {appUser.losses}패</span>
                  <span data-testid="text-user-winrate">
                    승률 {appUser.wins + appUser.losses > 0 ? Math.round((appUser.wins / (appUser.wins + appUser.losses)) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Promotion (Development/Test Mode) */}
          <div className="p-4">
            <AdminPromotion />
          </div>

          {/* Tier Progress Card */}
          <div className="p-4">
            <TierProgressCard user={appUser} />
          </div>

          {/* Stats Cards */}
          <div className="px-4 grid grid-cols-2 gap-4">
            <div className="bg-background rounded-xl p-4 text-center border border-border">
              <div className="text-2xl font-bold text-primary" data-testid="text-user-points-display">{appUser.points}</div>
              <div className="text-xs text-muted-foreground">보유 포인트</div>
            </div>
            <div className="bg-background rounded-xl p-4 text-center border border-border">
              <div className="text-2xl font-bold text-accent">-</div>
              <div className="text-xs text-muted-foreground">이번 시즌 순위</div>
            </div>
          </div>

          {/* Club Records Summary */}
          <div className="p-4">
            <div className="bg-background rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-4 flex items-center">
                <i className="fas fa-chart-pie mr-2 text-primary" />
                클럽 활동 요약
              </h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600" data-testid="text-club-meetings-attended">
                    {clubMeetingsAttended}
                  </div>
                  <div className="text-xs text-muted-foreground">클럽 모임 참여</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600" data-testid="text-club-matches-wins">
                    {clubMatchesWins}
                  </div>
                  <div className="text-xs text-muted-foreground">교류전 승</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600" data-testid="text-club-matches-losses">
                    {clubMatchesLosses}
                  </div>
                  <div className="text-xs text-muted-foreground">교류전 패</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">클럽 활동 통계</span>
                  <div className="flex space-x-4">
                    {clubStatsLoading ? (
                      <span>📊 로딩 중...</span>
                    ) : (
                      <>
                        <span>📊 총 {clubMeetingsAttended}경기</span>
                        <span>🏆 승률 {
                          clubMeetingsAttended > 0 
                            ? Math.round((clubMatchesWins / clubMeetingsAttended) * 100)
                            : 0
                        }%</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-4 space-y-2">
            <button 
              onClick={() => setShowProfileEditModal(true)}
              className="w-full text-left p-4 bg-background rounded-xl border border-border flex justify-between items-center hover:bg-muted transition-colors" 
              data-testid="button-edit-profile"
            >
              <span className="flex items-center">
                <i className="fas fa-user-edit w-6 mr-3 text-primary" />
                프로필 수정
              </span>
              <i className="fas fa-chevron-right text-muted-foreground" />
            </button>
            
            <button 
              onClick={() => setShowPointChargeModal(true)}
              className="w-full text-left p-4 bg-background rounded-xl border border-border flex justify-between items-center hover:bg-muted transition-colors" 
              data-testid="button-charge-points"
            >
              <span className="flex items-center">
                <i className="fas fa-coins w-6 mr-3 text-accent" />
                포인트 충전
              </span>
              <i className="fas fa-chevron-right text-muted-foreground" />
            </button>
            
            <button className="w-full text-left p-4 bg-background rounded-xl border border-border flex justify-between items-center hover:bg-muted transition-colors" data-testid="button-settings">
              <span className="flex items-center">
                <i className="fas fa-cog w-6 mr-3 text-muted-foreground" />
                설정
              </span>
              <i className="fas fa-chevron-right text-muted-foreground" />
            </button>
            
            <button 
              onClick={() => setShowFeedbackModal(true)}
              className="w-full text-left p-4 bg-background rounded-xl border border-border flex justify-between items-center hover:bg-muted transition-colors" 
              data-testid="button-feedback"
            >
              <span className="flex items-center">
                <i className="fas fa-lightbulb w-6 mr-3 text-green-600" />
                서비스 개선 제안
              </span>
              <i className="fas fa-chevron-right text-muted-foreground" />
            </button>

            {/* Admin Panel Button - Only visible to admin users */}
            {appUser.role === 'admin' && (
              <button 
                onClick={() => setShowAdminPanel(true)}
                className="w-full text-left p-4 bg-background rounded-xl border border-border flex justify-between items-center hover:bg-muted transition-colors" 
                data-testid="button-admin-panel"
              >
                <span className="flex items-center">
                  <i className="fas fa-shield-alt w-6 mr-3 text-orange-500" />
                  관리자 패널
                </span>
                <i className="fas fa-chevron-right text-muted-foreground" />
              </button>
            )}
            
            <button 
              onClick={handleLogout}
              className="w-full text-left p-4 bg-background rounded-xl border border-border flex justify-between items-center hover:bg-muted transition-colors" 
              data-testid="button-logout"
            >
              <span className="flex items-center">
                <i className="fas fa-sign-out-alt w-6 mr-3 text-destructive" />
                로그아웃
              </span>
              <i className="fas fa-chevron-right text-muted-foreground" />
            </button>
          </div>
        </div>
      </main>

      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* Chat Screen - Full overlay when active */}
      {showChatScreen && chatOpponent && (
        <div className="fixed inset-0 z-50">
          <ChatScreen
            matchId={isNewChatMode ? undefined : chatMatchId}
            chatRoomId={isNewChatMode ? chatMatchId : undefined}
            opponent={chatOpponent}
            onBack={handleCloseChatScreen}
          />
        </div>
      )}

      {/* Admin Panel - Full screen overlay for admin users */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-50">
          <div className="flex h-full">
            <button
              onClick={() => setShowAdminPanel(false)}
              className="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
              data-testid="button-close-admin"
            >
              <i className="fas fa-arrow-left text-gray-600" />
            </button>
            <AdminPanel />
          </div>
        </div>
      )}
      
      {/* Post Creation Modal */}
      <PostCreateModal
        isOpen={showPostModal}
        onClose={handleClosePostModal}
        onPostCreated={handlePostCreated}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      {/* Profile Modals */}
      <ProfileEditModal 
        isOpen={showProfileEditModal} 
        onClose={() => setShowProfileEditModal(false)} 
      />

      <PointChargeModal 
        isOpen={showPointChargeModal} 
        onClose={() => setShowPointChargeModal(false)} 
      />

      <ShopModal 
        isOpen={showShopModal} 
        onClose={() => setShowShopModal(false)} 
      />

      {/* User Profile Modal */}
      <UserProfileModal 
        isOpen={showUserProfileModal} 
        onClose={handleCloseUserProfileModal}
        userId={selectedUserId}
      />
    </div>
  );
}
