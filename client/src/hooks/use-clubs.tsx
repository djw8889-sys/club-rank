import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

/**
 * ✅ 내 클럽 멤버십 조회 훅
 * - Firebase 인증 토큰을 자동 포함
 * - 로그인 상태가 아닐 경우 요청 중단
 */
export function useMyClubMembership() {
  const { token, user } = useAuth();

  return useQuery({
    queryKey: ["my-club-membership"],
    enabled: !!token && !!user,
    queryFn: async () => {
      if (!token) throw new Error("Firebase 인증 토큰이 없습니다.");

      const res = await fetch("/api/clubs/my-membership", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("❌ [useMyClubMembership] API failed:", res.status, res.statusText);
        throw new Error("클럽 정보를 불러올 수 없습니다.");
      }

      const data = await res.json();
      console.log("✅ [useMyClubMembership] API response:", data);
      
      // ✅ API 응답 정규화: { items: [...] } → [...]
      return data.items || data || [];
    },
  });
}

/**
 * ✅ 특정 클럽의 멤버 목록 조회 훅
 */
export function useClubMembers(clubId: number) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["club-members", clubId],
    enabled: !!clubId && !!token,
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${clubId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("멤버 정보를 불러오지 못했습니다.");
      return res.json();
    },
  });
}

/**
 * ✅ 클럽 탈퇴 훅
 */
export function useLeaveClub() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (clubId: number) => {
      const res = await fetch(`/api/clubs/${clubId}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
