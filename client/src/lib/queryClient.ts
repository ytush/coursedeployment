import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Set up request options based on data type
  let options: RequestInit = {
    method,
    credentials: "include"
  };
  
  // Handle different data types appropriately
  if (data) {
    if (data instanceof FormData) {
      // FormData should be sent without Content-Type so the browser can set it with boundary
      options.body = data;
      console.log("Sending FormData request", method, url);
    } else {
      // For regular JSON data
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(data);
      console.log("Sending JSON request", method, url);
    }
  }
  
  const res = await fetch(url, options);
  
  // Check for errors
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
