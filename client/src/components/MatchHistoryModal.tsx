import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useFirestoreCollection } from '@/hooks/use-firebase';
import { Match } from '@shared/schema';

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MatchHistoryModal({ isOpen, onClose }: MatchHistoryModalProps) {
  const { user } = useAuth();
  
  // Get matches where user is requester
  const { data: requestedMatches, loading: requestedLoading } = useFirestoreCollection<Match & { id: string }>(
    'matches',
    user ? [{ field: 'requesterId', operator: '==', value: user.uid }] : [],
    'createdAt',
    'desc'
  );
  
  // Get matches where user is target
  const { data: targetedMatches, loading: targetedLoading } = useFirestoreCollection<Match & { id: string }>(
    'matches',
    user ? [{ field: 'targetId', operator: '==', value: user.uid }] : [],
    'createdAt',
    'desc'
  );
  
  // Combine and sort all matches
  const allMatches = [...requestedMatches, ...targetedMatches]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const loading = requestedLoading || targetedLoading;

  if (!isOpen) return null;

  const getMatchStatus = (match: Match) => {
    if (match.status === 'completed') {
      // Note: Match schema doesn't have winnerId, so we'll show completion status
      return {
        text: '완료',
        color: 'text-green-600 bg-green-100',
        icon: 'fas fa-trophy'
      };
    } else if (match.status === 'accepted') {
      return {
        text: '진행중',
        color: 'text-blue-600 bg-blue-100',
        icon: 'fas fa-clock'
      };
    } else if (match.status === 'pending') {
      return {
        text: '대기중',
        color: 'text-yellow-600 bg-yellow-100',
        icon: 'fas fa-hourglass-half'
      };
    } else {
      return {
        text: '취소됨',
        color: 'text-gray-600 bg-gray-100',
        icon: 'fas fa-ban'
      };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              <i className="fas fa-history mr-2 text-green-600" />
              경기 기록
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              data-testid="button-close-match-history"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span className="ml-2 text-gray-600">로딩 중...</span>
            </div>
          ) : allMatches.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-inbox text-4xl text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">경기 기록이 없습니다</p>
              <p className="text-sm text-gray-500">첫 매치를 신청해보세요!</p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="match-history-list">
              {allMatches.map((match) => {
                const status = getMatchStatus(match);
                const isRequester = match.requesterId === user?.uid;
                const opponentId = isRequester ? match.targetId : match.requesterId;
                const role = isRequester ? '신청함' : '신청받음';
                
                return (
                  <div
                    key={match.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    data-testid={`match-item-${match.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <i className={`fas ${isRequester ? 'fa-arrow-right' : 'fa-arrow-left'} text-gray-500 mr-2`} />
                        <span className="font-medium text-gray-900">
                          {role}: {opponentId || '알 수 없음'}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${status.color}`}>
                        <i className={`${status.icon} mr-1`} />
                        {status.text}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <i className="fas fa-calendar text-gray-400 mr-2 w-4" />
                        <span>{new Date(match.createdAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <i className="fas fa-map-marker-alt text-gray-400 mr-2 w-4" />
                        <span>{match.location || '위치 미정'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <i className="fas fa-clock text-gray-400 mr-2 w-4" />
                        <span>{match.scheduledAt ? new Date(match.scheduledAt).toLocaleString('ko-KR') : '시간 미정'}</span>
                      </div>

                      {/* Test version note */}
                      <div className="flex items-center pt-1">
                        <i className="fas fa-tag text-green-500 mr-2 w-4" />
                        <span className="text-xs text-green-600 font-medium">테스트 버전 - 무료</span>
                      </div>

                      {match.status === 'completed' && (
                        <div className="flex items-center pt-2">
                          <i className="fas fa-star text-yellow-400 mr-2 w-4" />
                          <span className="text-xs">경기 완료</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6">
            <Button
              onClick={onClose}
              className="w-full"
              data-testid="button-close-match-history-bottom"
            >
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}