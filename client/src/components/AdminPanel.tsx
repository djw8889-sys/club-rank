import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { User, Post, Match } from '@shared/schema';
import { calculateTier } from '@/utils/tierCalculator';
import { getAvatarSrc } from '@/utils/avatar';
import { useToast } from '@/hooks/use-toast';

export default function AdminPanel() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Permission check
  if (!appUser || appUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center" data-testid="access-denied">
          <i className="fas fa-lock text-4xl text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">접근 권한이 없습니다</h2>
          <p className="text-gray-500">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    );
  }

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch users
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        setUsers(usersData);

        // Fetch posts
        const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Post));
        setPosts(postsData);

        // Fetch matches
        const matchesQuery = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
        const matchesSnapshot = await getDocs(matchesQuery);
        const matchesData = matchesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Match));
        setMatches(matchesData);

      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast({
          title: "데이터 로딩 실패",
          description: "관리자 데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const updateUserPoints = async (userId: string, newPoints: number) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { points: newPoints });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, points: newPoints } : user
      ));
      
      toast({
        title: "포인트 수정 완료",
        description: `사용자의 포인트가 ${newPoints}P로 수정되었습니다.`,
      });
    } catch (error) {
      console.error('Error updating user points:', error);
      toast({
        title: "포인트 수정 실패",
        description: "권한이 없거나 오류가 발생했습니다. Firestore 보안 규칙을 확인하세요.",
        variant: "destructive",
      });
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts(posts.filter(post => post.id !== postId));
      
      toast({
        title: "게시글 삭제 완료",
        description: "게시글이 삭제되었습니다.",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "게시글 삭제 실패",
        description: "권한이 없거나 오류가 발생했습니다. Firestore 보안 규칙을 확인하세요.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900" data-testid="title-admin-panel">
              <i className="fas fa-cog mr-2 text-primary" />
              관리자 패널
            </h1>
            <div className="text-sm text-gray-500">
              {appUser.username} (관리자)
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'users', name: '사용자 관리', icon: 'fas fa-users' },
              { id: 'posts', name: '게시글 관리', icon: 'fas fa-file-alt' },
              { id: 'matches', name: '매치 현황', icon: 'fas fa-trophy' },
              { id: 'stats', name: '통계', icon: 'fas fa-chart-bar' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                data-testid={`tab-${tab.id}`}
              >
                <i className={`${tab.icon} mr-2`} />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'users' && (
          <div className="space-y-6" data-testid="panel-users">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  사용자 관리 ({users.length}명)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        등급/포인트
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        전적
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        가입일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => {
                      const tier = calculateTier(user.points, user.wins, user.losses);
                      return (
                        <tr key={user.id} data-testid={`user-row-${user.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img 
                                src={getAvatarSrc(user.photoURL, user, 256)}
                                alt={user.username}
                                className="w-10 h-10 rounded-full mr-4"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.username}
                                  {user.role === 'admin' && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      관리자
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                <div className="text-xs text-gray-400">NTRP {user.ntrp} • {user.region}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${tier.bgColor} ${tier.color}`}>
                                {tier.name}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{user.points}P</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.wins}승 {user.losses}패
                            <div className="text-xs text-gray-500">
                              승률 {user.wins + user.losses > 0 ? Math.round((user.wins / (user.wins + user.losses)) * 100) : 0}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <input
                                type="number"
                                defaultValue={user.points}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    const newPoints = parseInt((e.target as HTMLInputElement).value);
                                    if (!isNaN(newPoints)) {
                                      updateUserPoints(user.id, newPoints);
                                    }
                                  }
                                }}
                                data-testid={`input-points-${user.id}`}
                              />
                              <button
                                onClick={() => {
                                  const input = document.querySelector(`[data-testid="input-points-${user.id}"]`) as HTMLInputElement;
                                  const newPoints = parseInt(input.value);
                                  if (!isNaN(newPoints)) {
                                    updateUserPoints(user.id, newPoints);
                                  }
                                }}
                                className="text-primary hover:text-primary-dark"
                                data-testid={`button-update-points-${user.id}`}
                              >
                                <i className="fas fa-save" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-6" data-testid="panel-posts">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  게시글 관리 ({posts.length}개)
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {posts.map((post) => {
                  const author = users.find(u => u.id === post.authorId);
                  return (
                    <div key={post.id} className="px-6 py-4" data-testid={`post-${post.id}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{post.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <span>{author?.username || '알 수 없는 사용자'}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                            <span className="mx-2">•</span>
                            <span>좋아요 {post.likes}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('이 게시글을 삭제하시겠습니까?')) {
                              deletePost(post.id);
                            }
                          }}
                          className="ml-4 text-red-600 hover:text-red-900"
                          data-testid={`button-delete-post-${post.id}`}
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="panel-stats">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-users text-2xl text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">총 사용자</dt>
                  <dd className="text-lg font-medium text-gray-900">{users.length}명</dd>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-file-alt text-2xl text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">총 게시글</dt>
                  <dd className="text-lg font-medium text-gray-900">{posts.length}개</dd>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-trophy text-2xl text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">총 매치</dt>
                  <dd className="text-lg font-medium text-gray-900">{matches.length}경기</dd>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-check-circle text-2xl text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">완료된 매치</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {matches.filter(m => m.status === 'completed').length}경기
                  </dd>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}