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

export function resilientQuery<T>(queryFn: QueryFunction<T>): QueryFunction<T> {
  return async (context) => {
    try {
      return await withQueryTimeout(Promise.resolve(queryFn(context)));
    } catch (firstError) {
      console.warn("PixEarn: query failed, retrying silently", firstError);
      await new Promise((resolve) => setTimeout(resolve, 3_000));
      try {
        return await withQueryTimeout(Promise.resolve(queryFn(context)));
      } catch (secondError) {
        console.warn("PixEarn: retry failed, using cached empty state", secondError);
        throw secondError;
      }
    }
  };
}
