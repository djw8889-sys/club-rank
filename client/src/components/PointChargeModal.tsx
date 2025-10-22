import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface PointChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PointChargeModal({ isOpen, onClose }: PointChargeModalProps) {
  const { appUser, updateAppUser } = useAuth();
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // 테스트 버전용 포인트 패키지
  const pointPackages = [
    { amount: 100, label: '100P', description: '테스트용' },
    { amount: 500, label: '500P', description: '테스트용' },
    { amount: 1000, label: '1000P', description: '테스트용' },
    { amount: 2000, label: '2000P', description: '테스트용' }
  ];

  const handleCharge = async () => {
    if (selectedAmount === 0) {
      toast({
        title: "포인트 선택 필요",
        description: "충전할 포인트를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newPoints = (appUser?.points || 0) + selectedAmount;
      await updateAppUser({ points: newPoints });
      
      toast({
        title: "포인트 충전 완료",
        description: `${selectedAmount}P가 충전되었습니다! (현재 ${newPoints}P)`,
      });
      
      onClose();
      setSelectedAmount(0);
    } catch (error) {
      console.error('Point charge error:', error);
      toast({
        title: "포인트 충전 실패",
        description: "포인트 충전 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              <i className="fas fa-coins mr-2 text-accent" />
              포인트 충전
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              data-testid="button-close-point-charge"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>

          {/* 테스트 버전 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <i className="fas fa-info-circle text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-800">테스트 버전</p>
                <p className="text-xs text-blue-600 mt-1">
                  현재는 테스트 버전으로 포인트를 무료로 충전할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 현재 포인트 */}
          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-primary" data-testid="current-points">
              {appUser?.points || 0}P
            </div>
            <div className="text-sm text-gray-500">현재 보유 포인트</div>
          </div>

          {/* 포인트 패키지 */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {pointPackages.map((pkg) => (
              <button
                key={pkg.amount}
                onClick={() => setSelectedAmount(pkg.amount)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  selectedAmount === pkg.amount
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/50'
                }`}
                data-testid={`point-package-${pkg.amount}`}
              >
                <div className="text-lg font-bold text-gray-900">{pkg.label}</div>
                <div className="text-xs text-gray-500">{pkg.description}</div>
                {selectedAmount === pkg.amount && (
                  <i className="fas fa-check-circle text-primary mt-1" />
                )}
              </button>
            ))}
          </div>

          {/* 매칭 비용 안내 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
            <div className="flex items-center">
              <i className="fas fa-trophy text-green-500 mr-2" />
              <div className="text-xs text-green-700">
                <p className="font-medium">테스트 버전 안내</p>
                <p>매치 참가비: <span className="font-bold">0P</span> (무료)</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
              data-testid="button-cancel-point-charge"
            >
              취소
            </Button>
            <Button
              onClick={handleCharge}
              className="flex-1"
              disabled={loading || selectedAmount === 0}
              data-testid="button-confirm-point-charge"
            >
              {loading ? "충전 중..." : `${selectedAmount}P 충전`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}