import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  ListChecks,
  Settings,
  Trophy,
  Users,
  WalletCards,
} from "lucide-react";
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
  const username = p?.username ?? "your-username";
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${encodeURIComponent(username)}`
      : "";
  const isAdmin =
    data?.isAdmin === true ||
    p?.email?.toLowerCase() === "muhammaddanyal4545@gmail.com" ||
    p?.username?.toLowerCase() === "danyal955163";

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Copied!");
  }

  return (
    <AppShell title="Profile">
      <div className="space-y-5">
        {isAdmin && (
          <Button
            asChild
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 text-base font-black text-white shadow-lg shadow-red-500/25 hover:from-red-700 hover:to-rose-600"
          >
            <Link to="/admin">
              <Settings className="mr-2 size-5" /> Admin Panel
            </Link>
          </Button>
        )}

        <div className="flex items-start gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <PixEarnLogo size={64} animated showRing={false} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black">@{p?.username ?? "Loading profile"}</p>
            <p className="truncate text-sm text-muted-foreground">
              {p?.email ?? "Account details are loading"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Joined {p?.created_at ? fmtDate(p.created_at) : "recently"}
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

        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            icon={Trophy}
            label="Active package"
            value={data?.activePackage?.name ?? "FREE Package"}
            className="from-amber-100 to-yellow-50 text-amber-800"
          />
          <Stat
            icon={WalletCards}
            label="Total earnings"
            value={`${fmtCoins(p?.total_earned ?? 0)} (${fmtPkr(p?.total_earned ?? 0, coinsPerPkr)})`}
            className="from-emerald-100 to-green-50 text-emerald-800"
          />
          <Stat
            icon={ListChecks}
            label="Tasks completed"
            value={String(p?.tasks_completed ?? 0)}
            className="from-blue-100 to-sky-50 text-blue-800"
          />
          <Stat
            icon={Users}
            label="Referral code"
            value={p?.username ?? "Not set"}
            className="from-violet-100 to-purple-50 text-violet-800"
          />
        </div>

        <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white shadow-lg shadow-violet-500/20">
          <p className="text-xs font-bold uppercase tracking-widest text-white/75">
            Your referral link
          </p>
          <p className="mt-2 break-all rounded-xl bg-white/15 px-3 py-3 text-xs font-semibold ring-1 ring-white/20">
            {link}
          </p>
          <Button
            size="sm"
            className="mt-3 rounded-xl bg-white text-violet-700 hover:bg-white/90"
            onClick={() => void copyLink()}
          >
            <Copy className="mr-1 size-3.5" /> Copy Link
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

function Stat({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className={`rounded-3xl border border-white bg-gradient-to-br p-5 shadow-sm ${className}`}>
      <Icon className="size-7" />
      <p className="mt-4 text-xs font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 break-words text-lg font-black">{value}</p>
    </div>
  );
}
