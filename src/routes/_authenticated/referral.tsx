import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Link2, Share2, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { getReferralData } from "@/lib/app.functions";
import { fmtCoins, fmtDate, fmtPkr } from "@/lib/money";
import { withQueryTimeout } from "@/lib/query";

export const Route = createFileRoute("/_authenticated/referral")({
  head: () => ({
    meta: [
      { title: "Referrals — PixEarn" },
      { name: "description", content: "Invite friends and earn with PixEarn." },
    ],
  }),
  component: ReferralPage,
});

function ReferralPage() {
  const { data: me } = useMe();
  const fetchReferral = useServerFn(getReferralData);
  const { data } = useQuery({
    queryKey: ["referral"],
    retry: false,
    queryFn: async () => {
      try {
        return await withQueryTimeout(fetchReferral());
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 3_000));
        try {
          return await withQueryTimeout(fetchReferral());
        } catch {
          return { referred: [], earnings: [], totalCoins: 0 };
        }
      }
    },
  });
  const coinsPerPkr = Number(me?.settings?.["coins_per_pkr"] ?? 100);
  const username = me?.profile?.username;
  const link =
    typeof window !== "undefined" && username
      ? `${window.location.origin}/register?ref=${encodeURIComponent(username)}`
      : "";
  const shareText = `Join PixEarn and start earning: ${link}`;

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Link copied!");
  }

  return (
    <AppShell title="Referrals">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-500 p-6 text-white shadow-xl shadow-indigo-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-white/75">
                Grow with PixEarn
              </p>
              <h1 className="mt-2 text-3xl font-black">Invite & earn</h1>
              <p className="mt-2 max-w-md text-sm text-white/85">
                Earn 20% of every package your friend buys, plus 5% of their task earnings for 30
                days.
              </p>
            </div>
            <Users className="size-12 text-white/80" />
          </div>
          <div className="mt-6 rounded-2xl bg-white/15 p-3 ring-1 ring-white/25">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/75">
              Your referral link
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-xs font-semibold text-slate-800">
              <Link2 className="size-4 shrink-0 text-indigo-600" />
              <input
                readOnly
                value={link || "Your link will appear here"}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => void copyLink()}
                className="rounded-xl bg-white text-indigo-700 hover:bg-white/90"
              >
                <Copy className="mr-1 size-4" /> Copy Link
              </Button>
              <Button
                asChild
                size="sm"
                className="rounded-xl bg-[#25D366] text-white hover:bg-[#20bd5b]"
              >
                <a
                  href={link ? `https://wa.me/?text=${encodeURIComponent(shareText)}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Share2 className="mr-1 size-4" /> Share on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Total referral earnings
            </p>
            <p className="mt-2 text-3xl font-black">{fmtCoins(data?.totalCoins ?? 0)}</p>
            <p className="text-sm text-muted-foreground">
              {fmtPkr(data?.totalCoins ?? 0, coinsPerPkr)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Friends joined
            </p>
            <p className="mt-2 text-3xl font-black">{data?.referred.length ?? 0}</p>
            <p className="text-sm text-muted-foreground">People using your username</p>
          </div>
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
          <p className="px-5 py-4 text-sm font-black">Your referrals</p>
          {(data?.referred ?? []).length === 0 && (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              No referrals yet. Share your link to get started.
            </p>
          )}
          {(data?.referred ?? []).map((r) => (
            <div key={r.username} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-semibold">@{r.username}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs uppercase">
                {r.package_id}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
