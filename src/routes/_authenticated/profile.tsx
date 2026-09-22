import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine, ArrowUpFromLine, Copy } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PixEarnLogo } from "@/components/PixEarnLogo";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { fmtCoins, fmtDate, fmtPkr } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — PixEarn" },
      { name: "description", content: "Your PixEarn account details, totals and referral link." },
      { property: "og:title", content: "Profile — PixEarn" },
      {
        property: "og:description",
        content: "Your PixEarn account details, totals and referral link.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data } = useMe();
  const p = data?.profile;
  const coinsPerPkr = Number(data?.settings?.["coins_per_pkr"] ?? 100);
  const link =
    typeof window !== "undefined" && p?.referral_code
      ? `${window.location.origin}/register?ref=${p.referral_code}`
      : "";

  return (
    <AppShell title="Profile">
      <div className="space-y-4">
        <div className="flex items-start gap-4 rounded-3xl border border-border bg-white p-5">
          <PixEarnLogo size={64} animated showRing={false} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold">@{p?.username}</p>
            <p className="truncate text-sm text-muted-foreground">{p?.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Joined {fmtDate(p?.created_at)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <Button asChild size="sm" className="rounded-xl">
              <Link to="/deposit">
                <ArrowDownToLine className="mr-1 size-4" /> Deposit
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link to="/withdraw">
                <ArrowUpFromLine className="mr-1 size-4" /> Withdraw
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Active package" value={data?.activePackage?.name ?? "—"} />
          <Stat
            label="Total earnings"
            value={`${fmtCoins(p?.total_earned ?? 0)} (${fmtPkr(p?.total_earned ?? 0, coinsPerPkr)})`}
          />
          <Stat label="Tasks completed" value={String(p?.tasks_completed ?? 0)} />
        </div>

        <div className="rounded-3xl border border-border bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Referral code</p>
          <p className="mt-1 text-xl font-bold">{p?.referral_code ?? "—"}</p>
          <p className="mt-2 break-all text-xs text-muted-foreground">{link}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 rounded-xl"
            onClick={() => {
              void navigator.clipboard.writeText(link);
              toast.success("Referral link copied");
            }}
          >
            <Copy className="mr-1 size-3.5" /> Copy link
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="outline" className="h-12 rounded-2xl">
            <Link to="/history">History</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-2xl">
            <Link to="/referral">Referrals</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
