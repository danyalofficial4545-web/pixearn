import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/app.functions";
import { withQueryTimeout } from "@/lib/query";

const ADMIN_EMAIL = "muhammaddanyal4545@gmail.com";
const ADMIN_USERNAME = "danyal955163";
const SECOND_ADMIN_EMAIL = "muhammaddanyal4949@gmail.com";
const SECOND_ADMIN_USERNAME = "danyal955";

const emptyMe = {
  profile: null,
  packages: [],
  activePackage: null,
  settings: {} as Record<string, string>,
  isAdmin: false,
  today: { coins: 0, tasks: 0 },
};

export function useMe() {
  const fetchMe = useServerFn(getMe);
  const q = useQuery({
    queryKey: ["me"],
    retry: false,
    queryFn: async () => {
      try {
        const res = await withQueryTimeout(fetchMe());
        const isAdmin =
          res.isAdmin ||
          res.profile.email?.toLowerCase() === ADMIN_EMAIL ||
          res.profile.username?.toLowerCase() === ADMIN_USERNAME ||
          res.profile.email?.toLowerCase() === SECOND_ADMIN_EMAIL ||
          res.profile.username?.toLowerCase() === SECOND_ADMIN_USERNAME;
        return { ...res, isAdmin };
      } catch (firstError) {
        console.warn("PixEarn: account query failed, retrying silently", firstError);
        await new Promise((resolve) => setTimeout(resolve, 3_000));
        try {
          const res = await withQueryTimeout(fetchMe());
          const isAdmin =
            res.isAdmin ||
            res.profile.email?.toLowerCase() === ADMIN_EMAIL ||
            res.profile.username?.toLowerCase() === ADMIN_USERNAME ||
            res.profile.email?.toLowerCase() === SECOND_ADMIN_EMAIL ||
            res.profile.username?.toLowerCase() === SECOND_ADMIN_USERNAME;
          return { ...res, isAdmin };
        } catch (secondError) {
          console.warn("PixEarn: account retry failed; showing zero state", secondError);
          return emptyMe;
        }
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
