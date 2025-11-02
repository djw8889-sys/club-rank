// client/src/lib/queryClient.ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAuth } from "firebase/auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// ✅ 공통 API 요청 함수
export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown,
): Promise<Response> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    const idToken = user ? await user.getIdToken() : undefined;

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

// ✅ React Query 전용 fetch 함수
type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const auth = getAuth();
    const user = auth.currentUser;
    const idToken = user ? await user.getIdToken() : undefined;

    const headers: Record<string, string> = {
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    };

    const res = await fetch(`${BASE_URL}${queryKey[0]}`, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
