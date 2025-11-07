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
      console.log("\n🔍 [CLIENT] ================================================");
      console.log("🔍 [CLIENT] useMyClubMembership query starting");
      console.log("🔍 [CLIENT] User authenticated:", !!user);
      console.log("🔍 [CLIENT] Token exists:", !!token);
      console.log("🔍 [CLIENT] Token length:", token?.length || 0);
      console.log("🔍 [CLIENT] Token preview:", token ? token.substring(0, 30) + "..." : "N/A");
      
      if (!token) {
        console.error("❌ [CLIENT] No Firebase token available");
        throw new Error("Firebase 인증 토큰이 없습니다.");
      }

      console.log("🔍 [CLIENT] Sending request to /api/clubs/my-membership");
      console.log("🔍 [CLIENT] Headers: Authorization: Bearer [TOKEN]");
      
      const res = await fetch("/api/clubs/my-membership", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("🔍 [CLIENT] Response received");
      console.log("🔍 [CLIENT] Status:", res.status, res.statusText);
      console.log("🔍 [CLIENT] Headers:", Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("\n❌ [CLIENT] ================================================");
        console.error("❌ [CLIENT] API request FAILED");
        console.error("❌ [CLIENT] Status:", res.status, res.statusText);
        console.error("❌ [CLIENT] Response body:", errorText);
        console.error("❌ [CLIENT] ================================================\n");
        throw new Error("클럽 정보를 불러올 수 없습니다.");
      }

      const data = await res.json();
      console.log("✅ [CLIENT DEBUG] API raw response:", JSON.stringify(data, null, 2));
      console.log("✅ [CLIENT DEBUG] Response type:", typeof data);
      console.log("✅ [CLIENT DEBUG] Is Array?", Array.isArray(data));
      console.log("✅ [CLIENT DEBUG] Has items?", Array.isArray(data?.items));
      
      // ✅ API 응답 정규화: 항상 배열 형태로 반환
      let normalized;
      if (Array.isArray(data)) {
        normalized = data;
        console.log("✅ [CLIENT DEBUG] Normalized as direct array, length:", normalized.length);
      } else if (Array.isArray(data?.items)) {
        normalized = data.items;
        console.log("✅ [CLIENT DEBUG] Normalized from items property, length:", normalized.length);
      } else {
        normalized = [];
        console.warn("⚠️ [CLIENT DEBUG] Unexpected response format, returning empty array");
      }
      
      console.log("✅ [CLIENT DEBUG] Final normalized data:", normalized);
      return normalized;
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
