import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

/**
 * ✅ 내 클럽 멤버십 조회 훅
 * 현재 로그인한 사용자의 클럽 멤버십을 불러온다.
 */
export function useMyClubMembership() {
  return useQuery({
    queryKey: ["my-club-membership"],
    queryFn: async () => {
      const res = await fetch("/api/clubs/my-membership");
      if (!res.ok) throw new Error("클럽 정보를 불러올 수 없습니다.");
      return res.json();
    },
  });
}

/**
 * ✅ 특정 클럽의 멤버 목록 조회 훅
 */
export function useClubMembers(clubId: number) {
  return useQuery({
    queryKey: ["club-members", clubId],
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${clubId}/members`);
      if (!res.ok) throw new Error("멤버 정보를 불러오지 못했습니다.");
      return res.json();
    },
    enabled: !!clubId,
  });
}

/**
 * ✅ 클럽 탈퇴 훅
 */
export function useLeaveClub() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clubId: number) => {
      const res = await fetch(`/api/clubs/${clubId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("클럽 탈퇴에 실패했습니다.");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "클럽 탈퇴 완료",
        description: "클럽에서 성공적으로 탈퇴했습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["my-club-membership"] });
    },
    onError: () => {
      toast({
        title: "클럽 탈퇴 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });
}
