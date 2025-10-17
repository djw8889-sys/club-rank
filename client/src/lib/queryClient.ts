import { QueryClient, QueryFunction } from "@tanstack/react-query";

// ✅ BASE_URL 자동 인식 (Railway or localhost)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ✅ 공통 fetch 에러 핸들러
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// ✅ API 요청 함수 (모든 fetch URL에 BASE_URL 자동 포함)
export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // ✅ Firebase ID Token 포함 (로그인된 사용자용)
    let idToken = null;
    try {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      if (auth.currentUser) {
        idToken = await auth.currentUser.getIdToken();
      }
    } catch (error) {
      console.warn("Failed to get Firebase ID token:", error);
    }

    const headers: Record<string, string> = {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Network error: Unable to connect to ${BASE_URL}. Please check your connection.`,
      );
    }
    throw error;
  }
}

// ✅ React Query 공통 fetch 함수
type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // ✅ Firebase ID Token 포함
      let idToken = null;
      try {
        const { getAuth } = await import("firebase/auth");
        const auth = getAuth();
        if (auth.currentUser) {
          idToken = await auth.currentUser.getIdToken();
        }
      } catch (error) {
        console.warn("Failed to get Firebase ID token for query:", error);
      }

      const headers: Record<string, string> = {
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      };

      // ✅ BASE_URL 추가 (핵심 수정)
      const fullUrl = `${BASE_URL}${queryKey[0]}`;

      const res = await fetch(fullUrl, {
        headers,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          `Network error: Unable to connect to ${BASE_URL}. Please check your connection.`,
        );
      }
      throw error;
    }
  };

// ✅ React Query 클라이언트 설정
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
