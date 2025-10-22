import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function AdminPromotion() {
  const { appUser, user } = useAuth();
  const { toast } = useToast();

  const promoteToAdmin = async () => {
    if (!user || !appUser) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        role: 'admin'
      });
      
      toast({
        title: "관리자 권한 부여 완료",
        description: "페이지를 새로고침하여 관리자 기능을 활성화하세요.",
      });
    } catch (error) {
      console.error('Error promoting to admin:', error);
      toast({
        title: "권한 부여 실패",
        description: "관리자 권한 부여 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // Only show if user doesn't have admin role AND in development mode
  if (appUser?.role === 'admin' || import.meta.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-center space-x-3">
        <i className="fas fa-crown text-amber-500 text-lg" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-800">개발/테스트 모드</h3>
          <p className="text-sm text-amber-600 mt-1">
            관리자 기능을 테스트하려면 관리자 권한을 활성화하세요.
          </p>
        </div>
        <button
          onClick={promoteToAdmin}
          className="px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
          data-testid="button-promote-admin"
        >
          관리자 활성화
        </button>
      </div>
    </div>
  );
}