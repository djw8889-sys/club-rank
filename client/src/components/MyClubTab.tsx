import { useMyClubMembership } from "@/hooks/use-clubs";
import LoadingSpinner from "./LoadingSpinner";
import ClubDashboard from "./MyClubTabContent";
import { Button } from "@/components/ui/button";

export default function MyClubTab() {
  const { data: memberships, isLoading, isError, error } = useMyClubMembership();

  console.log("🔍 [COMPONENT DEBUG] MyClubTab render - isLoading:", isLoading);
  console.log("🔍 [COMPONENT DEBUG] MyClubTab render - isError:", isError);
  console.log("🔍 [COMPONENT DEBUG] MyClubTab render - error:", error);
  console.log("🔍 [COMPONENT DEBUG] MyClubTab render - memberships:", memberships);

  // ⏳ 로딩 상태
  if (isLoading) {
    console.log("🔍 [COMPONENT DEBUG] Rendering loading state");
    return (
      <div className="flex flex-col justify-center items-center py-16 text-muted-foreground">
        <LoadingSpinner size="lg" className="mb-4" />
        <p>클럽 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  // ⚠️ 에러 상태
  if (isError) {
    console.error("❌ [COMPONENT DEBUG] Rendering error state, error:", error);
    return (
      <div className="flex flex-col justify-center items-center py-16 text-center">
        <div className="text-destructive mb-4">
          <i className="fas fa-exclamation-triangle text-4xl" />
        </div>
        <p className="text-foreground font-semibold mb-2">클럽 정보를 불러올 수 없습니다</p>
        <p className="text-muted-foreground text-sm">잠시 후 다시 시도해주세요</p>
      </div>
    );
  }

  // ⚠️ 데이터 정규화 - 항상 배열로 처리
  const validMemberships = Array.isArray(memberships) ? memberships : [];
  console.log("🔍 [COMPONENT DEBUG] validMemberships count:", validMemberships.length);
  console.log("🔍 [COMPONENT DEBUG] validMemberships data:", validMemberships);
  
  const activeMembership = validMemberships.find(
    (m) => m?.membership?.isActive && m?.club
  );
  console.log("🔍 [COMPONENT DEBUG] activeMembership:", activeMembership);

  // 🚫 클럽 없음 → 안내 메시지
  if (!activeMembership) {
    console.log("🔍 [COMPONENT DEBUG] Rendering empty state (no active membership)");
    return (
      <div className="flex flex-col justify-center items-center py-16 text-center px-4">
        <div className="text-muted-foreground mb-4">
          <i className="fas fa-shield-alt text-6xl" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">가입된 클럽이 없습니다</h3>
        <p className="text-muted-foreground text-sm mb-6">
          클럽에 가입하여 다른 회원들과 함께 테니스를 즐기세요
        </p>
        <Button 
          className="bg-primary hover:bg-primary/90"
          data-testid="button-find-club"
        >
          <i className="fas fa-search mr-2" />
          클럽 찾아보기
        </Button>
      </div>
    );
  }

  // ✅ 정상 상태 - 클럽 대시보드 표시
  console.log("✅ [COMPONENT DEBUG] Rendering ClubDashboard with membership:", activeMembership);
  return <ClubDashboard membership={activeMembership} />;
}
