import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";

// --- 타입 정의 ---
interface ClubMembership {
  membership: {
    id: number;
    userId: string;
    clubId: number;
    role: "owner" | "admin" | "member";
    joinedAt: Date;
    isActive: boolean;
  };
  club: {
    id: number;
    name: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    description: string | null;
    primaryColor: string | null;
    rankingPoints: number | null;
    region: string;
    establishedAt: Date | null;
  };
}

interface ClubSearchResult {
  id: number;
  name: string;
  description: string | null;
  region: string;
  primaryColor: string | null;
  rankingPoints: number | null;
  memberCount: number;
  establishedAt: Date | null;
}

interface ClubMember {
  id: number;
  userId: string;
  clubId: number;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
  isActive: boolean;
}

// --- API 요청용 함수 ---
async function authorizedRequest<T>(
  method: string,
  url: string,
  data?: any,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // ✅ Firebase 토큰을 Authorization 헤더에 추가
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// --- 클럽 훅 정의 ---
export function useMyClubMembership() {
  const { token, user } = useAuth();

  return useQuery<ClubMembership[]>({
    queryKey: ["/api/clubs/my-membership", user?.uid],
    queryFn: async () =>
      authorizedRequest("GET", "/api/clubs/my-membership", undefined, token),
    enabled: !!token, // 로그인 및 토큰 존재 시에만 실행
  });
}

// 클럽 검색
export function useClubSearch(region: string) {
  return useQuery<ClubSearchResult[]>({
    queryKey: [`/api/clubs/search?region=${encodeURIComponent(region)}`],
    enabled: !!region,
  });
}

// 클럽 멤버 조회
export function useClubMembers(clubId: number) {
  return useQuery<ClubMember[]>({
    queryKey: ["/api/clubs", clubId, "members"],
    enabled: !!clubId,
  });
}

// 클럽 매치 조회
export function useClubMatches(clubId: number) {
  return useQuery({
    queryKey: ["/api/clubs", clubId, "matches"],
    enabled: !!clubId,
  });
}

// 클럽 생성
export function useCreateClub() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (clubData: {
      name: string;
      region: string;
      description?: string;
      logoUrl?: string;
      bannerUrl?: string;
      primaryColor?: string;
    }) => authorizedRequest("POST", "/api/clubs", clubData, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs/my-membership"] });
    },
  });
}

// 클럽 가입
export function useJoinClub() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (clubId: number) =>
      authorizedRequest("POST", `/api/clubs/${clubId}/join`, undefined, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs/my-membership"] });
    },
  });
}

// 클럽 탈퇴
export function useLeaveClub() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (clubId: number) =>
      authorizedRequest(
        "DELETE",
        `/api/clubs/${clubId}/leave`,
        undefined,
        token,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs/my-membership"] });
    },
  });
}

// 클럽 매치 생성
export function useCreateClubMatch() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: async ({
      clubId,
      matchData,
    }: {
      clubId: number;
      matchData: {
        receivingClubId: number;
        matchDate?: Date;
        matchLocation?: string;
        matchType?: "friendly" | "tournament" | "league";
        notes?: string;
      };
    }) =>
      authorizedRequest(
        "POST",
        `/api/clubs/${clubId}/matches`,
        matchData,
        token,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/clubs", variables.clubId, "matches"],
      });
    },
  });
}

// 멤버 역할 수정
export function useUpdateMemberRole() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: number;
      role: "owner" | "admin" | "member";
    }) =>
      authorizedRequest(
        "PATCH",
        `/api/clubs/members/${memberId}/role`,
        { role },
        token,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
    },
  });
}

// 멤버 제거
export function useRemoveMember() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (memberId: number) =>
      authorizedRequest(
        "DELETE",
        `/api/clubs/members/${memberId}`,
        undefined,
        token,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
    },
  });
}
