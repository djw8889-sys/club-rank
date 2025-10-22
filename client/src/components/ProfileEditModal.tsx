import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { appUser, updateAppUser } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    username: '',
    age: '',
    region: '',
    ntrp: '',
    bio: '',
    availableTimes: [] as string[]
  });
  
  const [loading, setLoading] = useState(false);

  const regions = [
    '서울', '부산', '인천', '대구', '대전', '광주', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
  ];

  const timeSlots = [
    '평일 오전', '평일 오후', '평일 저녁',
    '주말 오전', '주말 오후', '주말 저녁'
  ];

  useEffect(() => {
    if (isOpen && appUser) {
      setFormData({
        username: appUser.username || '',
        age: appUser.age ? appUser.age.toString() : '',
        region: appUser.region || '',
        ntrp: appUser.ntrp ? appUser.ntrp.toString() : '',
        bio: appUser.bio || '',
        availableTimes: appUser.availableTimes || []
      });
    }
  }, [isOpen, appUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: Partial<User> = {
        username: formData.username,
        age: formData.age,
        region: formData.region,
        ntrp: formData.ntrp,
        bio: formData.bio,
        availableTimes: formData.availableTimes
      };

      await updateAppUser(updateData);
      
      toast({
        title: "프로필 수정 완료",
        description: "프로필이 성공적으로 업데이트되었습니다.",
      });
      
      onClose();
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "프로필 수정 실패",
        description: "프로필 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTimeSlot = (timeSlot: string) => {
    setFormData(prev => ({
      ...prev,
      availableTimes: prev.availableTimes.includes(timeSlot)
        ? prev.availableTimes.filter(t => t !== timeSlot)
        : [...prev.availableTimes, timeSlot]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              <i className="fas fa-user-edit mr-2 text-primary" />
              프로필 수정
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              data-testid="button-close-profile-edit"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                닉네임
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                data-testid="input-username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                나이
              </label>
              <input
                type="text"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="나이를 입력하세요"
                required
                data-testid="input-age"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                지역
              </label>
              <select
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                data-testid="select-region"
              >
                <option value="">지역 선택</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NTRP 레이팅
              </label>
              <select
                value={formData.ntrp}
                onChange={(e) => setFormData(prev => ({ ...prev, ntrp: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                data-testid="select-ntrp"
              >
                <option value="">NTRP 선택</option>
                {[2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0].map(rating => (
                  <option key={rating} value={rating.toString()}>{rating}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                자기소개
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="간단한 자기소개를 작성해주세요..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                data-testid="textarea-bio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                가능한 시간
              </label>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map(timeSlot => (
                  <button
                    key={timeSlot}
                    type="button"
                    onClick={() => toggleTimeSlot(timeSlot)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.availableTimes.includes(timeSlot)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    data-testid={`toggle-time-${timeSlot.replace(' ', '-')}`}
                  >
                    {timeSlot}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
                data-testid="button-cancel-profile-edit"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
                data-testid="button-save-profile-edit"
              >
                {loading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}