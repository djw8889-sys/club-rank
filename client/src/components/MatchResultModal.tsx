import { useState } from "react";
import { useFirestore } from "@/hooks/use-firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAvatarSrc } from "@/utils/avatar";
import LoadingSpinner from "./LoadingSpinner";
import { Match, User } from "@shared/schema";

interface MatchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  currentUser: User;
  opponent: User | null;
}

export default function MatchResultModal({ 
  isOpen, 
  onClose, 
  match, 
  currentUser, 
  opponent 
}: MatchResultModalProps) {
  const { completeMatch } = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !match || !opponent) return null;

  const isRequester = match.requesterId === currentUser.id;

  const handleResult = async (result: 'requester_won' | 'target_won' | 'draw') => {
    setLoading(true);
    try {
      await completeMatch(match.id, result);
      
      const resultMessages = {
        'requester_won': isRequester ? '승리했습니다! 🎉' : '아쉽게 패배했습니다 😔',
        'target_won': isRequester ? '아쉽게 패배했습니다 😔' : '승리했습니다! 🎉',
        'draw': '무승부로 경기가 종료되었습니다 🤝'
      };

      toast({
        title: "경기 결과 저장 완료",
        description: resultMessages[result],
      });

      onClose();
    } catch (error) {
      console.error("Match completion error:", error);
      toast({
        title: "경기 결과 저장 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="modal-match-result">
      <div className="bg-background rounded-lg w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground" data-testid="text-modal-title">경기 결과 입력</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            data-testid="button-close-modal"
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Match Info */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <img 
                  src={getAvatarSrc(currentUser.photoURL, currentUser, 128)} 
                  alt={currentUser.username} 
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                />
                <p className="font-semibold text-sm" data-testid="text-current-user">
                  {currentUser.username}
                  <span className="block text-xs text-muted-foreground">나</span>
                </p>
              </div>
              <div className="text-2xl font-bold text-muted-foreground">VS</div>
              <div className="text-center">
                <img 
                  src={getAvatarSrc(opponent.photoURL, opponent, 128)} 
                  alt={opponent.username} 
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                />
                <p className="font-semibold text-sm" data-testid="text-opponent">
                  {opponent.username}
                  <span className="block text-xs text-muted-foreground">상대</span>
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              경기가 끝났나요? 결과를 선택해주세요.
            </p>
          </div>

          {/* Result Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => handleResult(isRequester ? 'requester_won' : 'target_won')}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold"
              data-testid="button-win"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <i className="fas fa-trophy mr-2" />
              )}
              내가 승리 🏆
            </Button>
            
            <Button
              onClick={() => handleResult(isRequester ? 'target_won' : 'requester_won')}
              disabled={loading}
              variant="outline"
              className="w-full border-red-200 hover:bg-red-50 py-4 text-lg font-semibold"
              data-testid="button-lose"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <i className="fas fa-handshake mr-2" />
              )}
              상대가 승리 😔
            </Button>
            
            <Button
              onClick={() => handleResult('draw')}
              disabled={loading}
              variant="outline"
              className="w-full py-4 text-lg font-semibold"
              data-testid="button-draw"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <i className="fas fa-equals mr-2" />
              )}
              무승부 🤝
            </Button>
          </div>

          {/* Points Info */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">포인트 안내</p>
            <div className="text-xs space-y-1">
              <p>🏆 승리: +25 포인트 보너스, +1승</p>
              <p>😔 패배: +1패 (포인트 환급 없음)</p>
              <p>🤝 무승부: +25 포인트 환급</p>
              <p className="text-muted-foreground/80">※ 테스트 버전으로 매치 참가비 무료</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}