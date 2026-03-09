import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const text = await res.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          errorMessage = json.message || json.error || text;
        } catch {
          errorMessage = text;
        }
      }
    } catch {
      // If we can't read the response, use status text
    }
    const error = new Error(errorMessage);
    (error as any).status = res.status;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('auth-token');
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    // If it's a network error (Failed to fetch), provide a more helpful message
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('فشل الاتصال بالسيرفر. يرجى التحقق من الاتصال بالإنترنت أو الاتصال بالدعم الفني.');
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('auth-token');
    const headers: Record<string, string> = {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
    
    try {
      const res = await fetch(queryKey.join("/") as string, {
        headers,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);

      const responseText = await res.text();
      if (!responseText || !responseText.trim()) {
        return null;
      }

      const contentType = res.headers.get("content-type") || "";
      const trimmed = responseText.trim();
      const looksLikeJson = trimmed.startsWith("{") || trimmed.startsWith("[");

      if (!contentType.includes("application/json") && !looksLikeJson) {
        throw new Error("تم استلام HTML بدل JSON من السيرفر. تحقق من مسارات API أو إعادة تشغيل الخادم.");
      }

      return JSON.parse(responseText);
    } catch (error: any) {
      // If it's a network error (Failed to fetch), provide a more helpful message
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('فشل الاتصال بالسيرفر. يرجى التحقق من الاتصال بالإنترنت أو الاتصال بالدعم الفني.');
      }
      throw error;
    }
  };

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

