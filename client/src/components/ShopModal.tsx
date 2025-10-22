import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShopModal({ isOpen, onClose }: ShopModalProps) {
  if (!isOpen) return null;

  const comingSoonItems = [
    {
      id: 'premium-racket',
      name: '프리미엄 라켓 스킨',
      description: '경기에서 스타일을 뽐내세요',
      price: 500,
      icon: '🎾'
    },
    {
      id: 'court-background',
      name: '전용 코트 배경',
      description: '나만의 테니스 코트 테마',
      price: 300,
      icon: '🏟️'
    },
    {
      id: 'victory-celebration',
      name: '승리 축하 이모티콘',
      description: '승리 후 특별한 애니메이션',
      price: 200,
      icon: '🏆'
    },
    {
      id: 'nickname-decoration',
      name: '닉네임 장식',
      description: '특별한 닉네임 효과',
      price: 150,
      icon: '✨'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              <i className="fas fa-store mr-2 text-green-600" />
              클럽 랭크 상점
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              data-testid="button-close-shop"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>

          {/* 상점 헤더 */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 mb-6 text-white">
            <div className="flex items-center justify-center mb-2">
              <i className="fas fa-rocket text-2xl mr-2" />
              <h3 className="text-lg font-bold">향후 업데이트 예정!</h3>
            </div>
            <p className="text-center text-sm text-green-100">
              경기에서 획득한 포인트로 다양한 아이템을 구매할 수 있습니다
            </p>
          </div>

          {/* Coming Soon 안내 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
              <i className="fas fa-clock mr-2" />
              2025년 상반기 오픈 예정
            </div>
          </div>

          {/* 예정 아이템 목록 */}
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-gray-900 text-center">미리보기 아이템</h4>
            {comingSoonItems.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 relative overflow-hidden"
                data-testid={`shop-item-${item.id}`}
              >
                {/* Coming Soon 오버레이 */}
                <div className="absolute inset-0 bg-gray-50/90 flex items-center justify-center z-10">
                  <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">
                    Coming Soon
                  </span>
                </div>
                
                <div className="flex items-center">
                  <div className="text-3xl mr-4">{item.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <div className="flex items-center mt-2">
                      <i className="fas fa-coins text-yellow-500 mr-1" />
                      <span className="font-bold text-green-600">{item.price}P</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 특별 혜택 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <i className="fas fa-gift text-blue-500 mr-2 mt-1" />
              <div>
                <p className="text-sm font-medium text-blue-800">런칭 기념 혜택</p>
                <p className="text-xs text-blue-600 mt-1">
                  상점 오픈 시 모든 사용자에게 <span className="font-bold">500P 보너스</span> 지급 예정!
                </p>
              </div>
            </div>
          </div>

          {/* 포인트 활용 가이드 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">
              <i className="fas fa-lightbulb text-yellow-500 mr-2" />
              포인트 획득 방법
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• 🏆 경기 승리: +25P</p>
              <p>• 🤝 경기 참여: +5P</p>
              <p>• 📝 커뮤니티 활동: +10P</p>
              <p>• 🎯 일일 로그인: +5P</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-green-600 hover:bg-green-700"
              data-testid="button-shop-close"
            >
              <i className="fas fa-check mr-2" />
              확인
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}