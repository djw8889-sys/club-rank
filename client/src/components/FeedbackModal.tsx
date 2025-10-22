import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/hooks/use-firebase';
import { useAuth } from '@/hooks/use-auth';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState('suggestion');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { addDocument } = useFirestore();
  const { appUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: "피드백을 입력해주세요",
        description: "피드백 내용을 작성해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!appUser) {
      toast({
        title: "로그인이 필요합니다",
        description: "피드백을 제출하려면 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await addDocument('feedback', {
        userId: appUser.id,
        username: appUser.username,
        category,
        content: feedback,
        status: 'new'
      });

      toast({
        title: "피드백이 제출되었습니다",
        description: "소중한 의견 감사합니다. 검토 후 반영하겠습니다.",
      });

      setFeedback('');
      setCategory('suggestion');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "피드백 제출 실패",
        description: "오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="feedback-modal">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">서비스 개선 제안</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            data-testid="button-close-feedback"
          >
            <i className="fas fa-times text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              data-testid="select-feedback-category"
            >
              <option value="suggestion">개선 제안</option>
              <option value="bug">버그 신고</option>
              <option value="feature">새 기능 요청</option>
              <option value="other">기타</option>
            </select>
          </div>

          {/* Feedback Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              피드백 내용
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="서비스 개선을 위한 소중한 의견을 들려주세요..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              data-testid="textarea-feedback-content"
            />
            <div className="text-xs text-gray-500 mt-1">
              {feedback.length}/500
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              data-testid="button-cancel-feedback"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading || !feedback.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-submit-feedback"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <i className="fas fa-paper-plane mr-2" />
              )}
              {loading ? '제출 중...' : '제출하기'}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-4 p-3 bg-green-50 rounded-xl">
          <p className="text-xs text-green-700 text-center">
            <i className="fas fa-info-circle mr-1" />
            모든 피드백은 익명으로 처리되며, 서비스 개선에 활용됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}