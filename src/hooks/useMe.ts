import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/app.functions";

const ADMIN_EMAIL = "muhammaddanyal4545@gmail.com";
const ADMIN_USERNAME = "danyal955163";

export function useMe() {
  const fetchMe = useServerFn(getMe);
  const q = useQuery({
    queryKey: ["me"],
    retry: 1,
    queryFn: async () => {
      try {
        const res = await Promise.race([
          fetchMe(),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000)),
        ]);
        const isAdmin =
          res.isAdmin ||
          res.profile.email?.toLowerCase() === ADMIN_EMAIL ||
          res.profile.username?.toLowerCase() === ADMIN_USERNAME;
        return { ...res, isAdmin };
      } catch (err) {
        console.error("PixEarn: failed to load account", err);
        throw new Error("Database connection error");
      }
    },
  });
  return q;
}

export function useRefreshMe() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["me"] });
    void qc.invalidateQueries({ queryKey: ["history"] });
    void qc.invalidateQueries({ queryKey: ["tasks"] });
    void qc.invalidateQueries({ queryKey: ["referral"] });
  };
}
