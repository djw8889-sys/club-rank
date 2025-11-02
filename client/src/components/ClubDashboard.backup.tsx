import { useState } from "react";
import {
  useMyClubMembership,
  useClubMembers,
  useLeaveClub,
} from "@/hooks/use-clubs";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function ClubDashboard() {
  const { toast } = useToast();
  const [confirmLeave, setConfirmLeave] = useState(false);

  // ✅ 내 클럽 가입 정보 가져오기
  const {
    data: myMembership,
    isLoading: membershipLoading,
    error: membershipError,
  } = useMyClubMembership();

  // ✅ 클럽원 목록 불러오기
  const {
    data: clubMembers,
    isLoading: membersLoading,
    error: membersError,
  } = useClubMembers(myMembership?.clubId);

  // ✅ 클럽 탈퇴 mutation
  const leaveClubMutation = useLeaveClub();

  // ✅ 탈퇴 핸들러
  const handleLeaveClub = async () => {
    if (!myMembership?.clubId) return;
    try {
      await leaveClubMutation.mutateAsync(myMembership.clubId);
      toast({
        title: "클럽 탈퇴 완료",
        description: "클럽에서 성공적으로 탈퇴했습니다.",
      });
      setConfirmLeave(false);
    } catch (error: any) {
      toast({
        title: "탈퇴 실패",
        description: error.message || "클럽 탈퇴 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (membershipLoading || membersLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  if (membershipError || !myMembership) {
    return (
      <div className="text-center text-muted-foreground p-6">
        클럽 가입 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ 클럽 기본 정보 */}
      <div className="bg-card rounded-xl p-6 shadow-md border border-border">
        <h2 className="text-xl font-semibold mb-2">{myMembership.clubName}</h2>
        <p className="text-sm text-muted-foreground">
          역할: {myMembership.role === "leader" ? "리더" : "일반 회원"}
        </p>
        <p className="text-sm text-muted-foreground">
          가입일: {new Date(myMembership.joinedAt).toLocaleDateString("ko-KR")}
        </p>

        {/* ✅ 탈퇴 버튼 */}
        <div className="mt-4">
          {confirmLeave ? (
            <div className="flex items-center gap-3">
              <Button
                variant="destructive"
                onClick={handleLeaveClub}
                disabled={leaveClubMutation.isPending}
              >
                {leaveClubMutation.isPending && (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                )}
                탈퇴 확인
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmLeave(false)}
                disabled={leaveClubMutation.isPending}
              >
                취소
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setConfirmLeave(true)}
              disabled={leaveClubMutation.isPending}
            >
              클럽 탈퇴
            </Button>
          )}
        </div>
      </div>

      {/* ✅ 클럽원 목록 */}
      <div className="bg-card rounded-xl p-6 shadow-md border border-border">
        <h3 className="text-lg font-semibold mb-4">클럽원 목록</h3>
        {membersError ? (
          <p className="text-muted-foreground text-sm">
            클럽원 목록을 불러오는 중 오류가 발생했습니다.
          </p>
        ) : clubMembers?.length ? (
          <ul className="space-y-2">
            {clubMembers.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between border-b border-border pb-2"
              >
                <span>{member.username}</span>
                <span className="text-xs text-muted-foreground">
                  {member.role}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">클럽원이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
export default ClubDashboard;
