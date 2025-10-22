import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User } from '@shared/schema';
import { getAvatarSrc } from '@/utils/avatar';

interface MatchRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetUser: User | null;
  currentUserPoints: number;
  isLoading: boolean;
}

export default function MatchRequestModal({
  isOpen,
  onClose,
  onConfirm,
  targetUser,
  currentUserPoints,
  isLoading
}: MatchRequestModalProps) {
  const matchCost = 0; // Test version: free matches
  const hasEnoughPoints = currentUserPoints >= matchCost;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="text-match-request-title">
            매치 신청 확인
          </DialogTitle>
          <DialogDescription data-testid="text-match-request-description">
            {targetUser ? (
              <>
                <strong>{targetUser.username}</strong>님에게 매치를 신청하시겠습니까?
              </>
            ) : (
              "매치를 신청하시겠습니까?"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Player Info */}
          {targetUser && (
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <img 
                src={getAvatarSrc(targetUser.photoURL, targetUser, 96)} 
                alt={targetUser.username} 
                className="w-12 h-12 rounded-full object-cover"
                data-testid="img-target-user"
              />
              <div>
                <p className="font-semibold text-foreground" data-testid="text-target-username">
                  {targetUser.username}
                </p>
                <p className="text-sm text-muted-foreground" data-testid="text-target-info">
                  NTRP {targetUser.ntrp} • {targetUser.region}
                </p>
                <p className="text-xs text-muted-foreground" data-testid="text-target-record">
                  {targetUser.wins}승 {targetUser.losses}패
                </p>
              </div>
            </div>
          )}

          {/* Cost Information */}
          <div className="space-y-2 p-3 border rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">매치 신청 비용</span>
              <span className="font-semibold text-green-600" data-testid="text-match-cost">
                무료 (테스트 버전)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">현재 보유 포인트</span>
              <span className="font-semibold" data-testid="text-current-points">
                {currentUserPoints}P
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">신청 후 포인트</span>
              <span 
                className={`font-semibold ${hasEnoughPoints ? 'text-primary' : 'text-destructive'}`}
                data-testid="text-points-after"
              >
                {hasEnoughPoints ? currentUserPoints - matchCost : currentUserPoints}P
              </span>
            </div>
          </div>

          {/* Warning if insufficient points */}
          {!hasEnoughPoints && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive" data-testid="text-insufficient-points">
                포인트가 부족합니다. 매치 신청을 위해 {matchCost}P가 필요합니다.
              </p>
            </div>
          )}

          {/* Info about match flow */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• 테스트 버전으로 매치 신청이 무료입니다</p>
            <p>• 상대방이 수락해도 포인트가 차감되지 않습니다</p>
            <p>• 승리 시 +25P 보너스를 받을 수 있습니다</p>
            <p>• 무승부 시 각자 +25P를 받습니다</p>
          </div>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
            data-testid="button-cancel-match"
          >
            취소
          </Button>
          <Button 
            onClick={onConfirm}
            className="flex-1"
            disabled={!hasEnoughPoints || isLoading}
            data-testid="button-confirm-match"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2" />
                신청 중...
              </>
            ) : (
              <>
                <i className="fas fa-tennis-ball mr-2" />
                신청하기
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}