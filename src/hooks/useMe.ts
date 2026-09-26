import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/app.functions";
import { withQueryTimeout } from "@/lib/query";

const ADMIN_EMAILS = ["muhammaddanyal4949@gmail.com", "muhammaddanyal4545@gmail.com"];
const ADMIN_USERNAMES = ["danyal955", "danyal955163", "danyal1953"];

const emptyMe = {
  profile: null,
  packages: [],
  activePackage: null,
  settings: {} as Record<string, string>,
  isAdmin: false,
  today: { coins: 0, tasks: 0 },
};

type Me = Omit<Awaited<ReturnType<typeof getMe>>, "settings"> & {
  settings: Record<string, string>;
};

function isPermanentAdmin(profile: { email?: string | null; username?: string | null } | null) {
  const email = profile?.email?.trim().toLowerCase();
  const username = profile?.username?.trim().toLowerCase();
  return Boolean(
    (email && ADMIN_EMAILS.includes(email)) || (username && ADMIN_USERNAMES.includes(username)),
  );
}

export function useMe() {
  const fetchMe = useServerFn(getMe);
  const q = useQuery<Me>({
    queryKey: ["me"],
    retry: false,
    queryFn: async () => {
      try {
        const res = await withQueryTimeout(fetchMe());
        return { ...res, isAdmin: isPermanentAdmin(res.profile) };
      } catch (firstError) {
        console.warn("PixEarn: account query failed, retrying silently", firstError);
        await new Promise((resolve) => setTimeout(resolve, 3_000));
        try {
          const res = await withQueryTimeout(fetchMe());
          return { ...res, isAdmin: isPermanentAdmin(res.profile) };
        } catch (secondError) {
          console.warn("PixEarn: account retry failed; showing zero state", secondError);
          return emptyMe as unknown as Me;
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
