"use client";

export async function callApi<T>(
  path: string,
  token: string,
  options?: { method?: "GET" | "POST"; body?: unknown },
): Promise<T> {
  const response = await fetch(path, {
    method: options?.method ?? "GET",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? "Request gagal");
  }
  return data as T;
}

