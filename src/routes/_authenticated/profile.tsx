import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  ListChecks,
  Share2,
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
  const user = data?.profile;
  const profile = data?.profile;
  const coinsPerPkr = Number(data?.settings?.["coins_per_pkr"] ?? 100);
  const userName = user?.username || profile?.username || "danyal955163";
  const referralCode = userName;
  const referralLink = `https://pixearn.vercel.app/register?ref=${userName}`;
  const userRole = (user as { role?: string } | null | undefined)?.role;
  const isAdmin =
    user?.email?.toLowerCase() === "muhammaddanyal4545@gmail.com" ||
    user?.username?.toLowerCase() === "danyal955163" ||
    userRole === "admin" ||
    data?.isAdmin === true;

  async function copyLink() {
    await navigator.clipboard.writeText(referralLink);
    alert(`Copied: ${referralLink}`);
    toast.success("Link Copied! ✅");
  }

  function shareLink() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Join PixEarn! My link: ${referralLink}`)}`,
      "_blank",
    );
  }

  return (
    <AppShell title="Profile">
      <div className="space-y-5">
        {isAdmin && (
          <a
            href="/admin"
            style={{
              display: "block",
              background: "linear-gradient(135deg,#FF0000,#FF8C00)",
              color: "white",
              padding: "18px",
              borderRadius: "14px",
              textAlign: "center",
              fontWeight: "900",
              fontSize: "18px",
              marginBottom: "16px",
              textDecoration: "none",
            }}
          >
            ⚙️ ADMIN PANEL - Click to Manage
          </a>
        )}

        <div className="flex items-start gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <PixEarnLogo size={64} animated showRing={false} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-black">@{userName}</h2>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {user?.created_at ? `Joined ${fmtDate(user.created_at)}` : ""}
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
            value={`${fmtCoins(user?.total_earned ?? 0)} (${fmtPkr(user?.total_earned ?? 0, coinsPerPkr)})`}
            className="from-emerald-100 to-green-50 text-emerald-800"
          />
          <Stat
            icon={ListChecks}
            label="Tasks completed"
            value={String(user?.tasks_completed ?? 0)}
            className="from-blue-100 to-sky-50 text-blue-800"
          />
          <Stat
            icon={Users}
            label="Referral code"
            value={referralCode}
            className="from-violet-100 to-purple-50 text-violet-800"
          />
        </div>

        <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white shadow-lg shadow-violet-500/20">
          <p className="text-xs font-bold uppercase tracking-widest text-white/75">
            Your referral link
          </p>
          <p className="mt-2 break-all rounded-xl bg-white/15 px-3 py-3 text-xs font-semibold ring-1 ring-white/20">
            {referralLink}
          </p>
          <input
            readOnly
            value={referralLink}
            aria-label="Referral link"
            onFocus={(e) => e.currentTarget.select()}
            className="mt-3 w-full rounded-xl bg-white px-3 py-3 text-xs font-semibold text-slate-800 outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="rounded-xl bg-white text-violet-700 hover:bg-white/90"
              onClick={() => void copyLink()}
            >
              <Copy className="mr-1 size-3.5" /> Copy Link
            </Button>
            <Button
              size="sm"
              className="rounded-xl bg-[#25D366] text-white hover:bg-[#20bd5b]"
              onClick={shareLink}
            >
              <Share2 className="mr-1 size-3.5" /> Share
            </Button>
          </div>
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
