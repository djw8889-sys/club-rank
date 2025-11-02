import { Button } from "@/components/ui/button";
import { useLeaveClub } from "@/hooks/use-clubs";
import { useToast } from "@/hooks/use-toast";

export function ClubDashboard({ membership }: { membership: any }) {
  const { toast } = useToast();
  const leaveClub = useLeaveClub();

  // ✅ null 방어
  if (!membership || !membership.club) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        ⚠️ 클럽 데이터를 불러오지 못했습니다.
        <br />
        잠시 후 다시 시도해주세요.
      </div>
    );
  }

  const club = membership.club;
  const clubName = club.name || "이름 없는 클럽";

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-primary to-emerald-600 p-6 text-white rounded-xl">
        <h2 className="text-2xl font-bold">{clubName}</h2>
        <p className="opacity-90">🏸 클럽을 함께 성장시켜보세요!</p>
      </div>

      <div className="p-4 bg-background rounded-lg border border-border">
        <h3 className="text-lg font-semibold mb-2">내 멤버십 정보</h3>
        <p>클럽 ID: {membership.clubId}</p>
        <p>활성 상태: {membership.isActive ? "✅ 활성" : "❌ 비활성"}</p>

        <div className="mt-4">
          <Button
            variant="destructive"
            onClick={() => {
              leaveClub.mutate(membership.clubId);
            }}
          >
            클럽 탈퇴하기
          </Button>
        </div>
      </div>
    </div>
  );
}
