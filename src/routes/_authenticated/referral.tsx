import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { getReferralData } from "@/lib/app.functions";
import { fmtCoins, fmtDate, fmtPkr } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/referral")({
  head: () => ({
    meta: [
      { title: "Referrals — PixEarn" },
      { name: "description", content: "Invite friends and earn 20% of packages plus 5% of tasks." },
      { property: "og:title", content: "Referrals — PixEarn" },
      {
        property: "og:description",
        content: "Invite friends and earn 20% of packages plus 5% of tasks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReferralPage,
});

function ReferralPage() {
  const { data: me } = useMe();
  const fetchReferral = useServerFn(getReferralData);
  const { data } = useQuery({ queryKey: ["referral"], queryFn: () => fetchReferral() });

  const coinsPerPkr = Number(me?.settings?.["coins_per_pkr"] ?? 100);
  const code = me?.profile.referral_code;
  const link =
    typeof window !== "undefined" && code ? `${window.location.origin}/register?ref=${code}` : "";
  const shareText = `Join PixEarn and earn coins daily! ${link}`;

  return (
    <AppShell title="Referrals">
      <div className="space-y-4">
        <div className="rounded-3xl brand-gradient p-5 text-white shadow-lg shadow-indigo-500/20">
          <p className="text-sm font-bold">Earn 20% + 5%</p>
          <p className="text-xs text-white/85">
            20% of every package your friend buys, plus 5% of their daily task earnings for 30 days.
          </p>
          <p className="mt-3 break-all rounded-xl bg-white/15 px-3 py-2 text-xs">{link}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-xl"
              onClick={() => {
                void navigator.clipboard.writeText(link);
                toast.success("Link copied");
              }}
            >
              <Copy className="mr-1 size-3.5" /> Copy
            </Button>
            <Button asChild size="sm" variant="secondary" className="rounded-xl">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Share2 className="mr-1 size-3.5" /> WhatsApp
              </a>
            </Button>
            <Button asChild size="sm" variant="secondary" className="rounded-xl">
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(link)}`}
                target="_blank"
                rel="noreferrer"
              >
                Telegram
              </a>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-border bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total referral earnings</p>
            <p className="mt-1 text-2xl font-extrabold">{fmtCoins(data?.totalCoins ?? 0)}</p>
            <p className="text-sm text-muted-foreground">
              {fmtPkr(data?.totalCoins ?? 0, coinsPerPkr)}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Friends joined</p>
            <p className="mt-1 text-2xl font-extrabold">{data?.referred.length ?? 0}</p>
          </div>
        </div>

        <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-white">
          <p className="px-4 py-3 text-sm font-bold">Your referrals</p>
          {(data?.referred ?? []).length === 0 && (
            <p className="px-4 py-4 text-sm text-muted-foreground">No referrals yet.</p>
          )}
          {(data?.referred ?? []).map((r) => (
            <div key={r.username} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">@{r.username}</p>
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
