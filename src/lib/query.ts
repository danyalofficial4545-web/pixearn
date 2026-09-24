import type { QueryFunction } from "@tanstack/react-query";

export const QUERY_TIMEOUT_MS = 8_000;

export function withQueryTimeout<T>(promise: Promise<T>, timeoutMs = QUERY_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeoutMs),
    ),
  ]);
}

export async function fetchWithSilentRetry<T>(fetcher: () => Promise<T>, fallback: T) {
  try {
    return await withQueryTimeout(fetcher());
  } catch (firstError) {
    console.error("PixEarn: query failed, retrying silently", firstError);
    await new Promise((resolve) => setTimeout(resolve, 3_000));
    try {
      return await withQueryTimeout(fetcher());
    } catch (secondError) {
      console.error("PixEarn: retry failed; using fallback data", secondError);
      return fallback;
    }
  }
}

export function resilientQuery<T>(queryFn: QueryFunction<T>): QueryFunction<T> {
  return async (context) =>
    fetchWithSilentRetry(() => Promise.resolve(queryFn(context)), undefined as T);
}
