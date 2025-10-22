import { useState } from "react";
import { useMyClubMembership } from "@/hooks/use-clubs";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "./LoadingSpinner";
import ClubDashboard from "./ClubDashboard";
import ClubCreationModal from "./ClubCreationModal";
import ClubSearchModal from "./ClubSearchModal";

export default function MyClubTabContent() {
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  const { data: memberships = [], isLoading, isError } = useMyClubMembership();
  
  // 사용자의 첫 번째 활성 클럽 멤버십 가져오기
  const activeMembership = memberships.find((m) => m.membership.isActive);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground text-sm">클럽 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <div className="bg-background rounded-xl p-6 text-center border border-border">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">클럽 정보 로드 실패</h3>
          <p className="text-muted-foreground mb-4">
            클럽 정보를 불러오는 중 오류가 발생했습니다.<br />
            잠시 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    );
  }

  // 클럽에 가입되어 있는 경우
  if (activeMembership) {
    return (
      <div className="p-4">
        <ClubDashboard membership={activeMembership} />
      </div>
    );
  }

  // 클럽에 가입되어 있지 않은 경우
  return (
    <>
      <div className="bg-gradient-to-r from-primary to-emerald-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🏠 내 클럽</h2>
        <p className="opacity-90">클럽 활동의 모든 것을 관리하세요</p>
      </div>
      
      <div className="p-4">
        <div className="bg-background rounded-xl p-6 text-center border border-border">
          <div className="text-6xl mb-4">🛡️</div>
          <h3 className="text-lg font-semibold mb-2" data-testid="text-no-club-title">
            아직 가입된 클럽이 없습니다
          </h3>
          <p className="text-muted-foreground mb-6">
            새로운 클럽을 만들거나 기존 클럽에 가입해<br />
            다른 테니스 애호가들과 함께 활동해보세요!
          </p>
          
          <div className="space-y-3 max-w-sm mx-auto">
            <Button 
              onClick={() => setShowCreationModal(true)}
              className="w-full"
              size="lg"
              data-testid="button-create-new-club"
            >
              <i className="fas fa-plus mr-2" />
              새 클럽 만들기
            </Button>
            
            <Button 
              onClick={() => setShowSearchModal(true)}
              variant="outline"
              className="w-full"
              size="lg"
              data-testid="button-search-clubs"
            >
              <i className="fas fa-search mr-2" />
              기존 클럽 찾기
            </Button>
          </div>
          
          <div className="mt-6 text-xs text-muted-foreground">
            💡 클럽 가입 후 정기 모임, 교류전, 랭킹 시스템을 이용할 수 있습니다
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <ClubCreationModal 
        isOpen={showCreationModal}
        onClose={() => setShowCreationModal(false)}
      />
      
      <ClubSearchModal 
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </>
  );
}