import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  CheckCircle2,
  Coins,
  Gift,
  Lock,
  Trophy,
  Wallet,
} from "lucide-react";
import { AppShell, ReferralBanner } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { getTasks } from "@/lib/app.functions";
import { fmtCoins, fmtDate, fmtPkr, fmtUsd } from "@/lib/money";
import { withQueryTimeout } from "@/lib/query";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PixEarn" },
      { name: "description", content: "Your PixEarn balance, package and today's tasks." },
      { property: "og:title", content: "Dashboard — PixEarn" },
      { property: "og:description", content: "Your PixEarn balance, package and today's tasks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data } = useMe();
  const fetchTasks = useServerFn(getTasks);
  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    retry: false,
    queryFn: async () => {
      try {
        return await withQueryTimeout(fetchTasks());
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 3_000));
        try {
          return await withQueryTimeout(fetchTasks());
        } catch {
          return { tasks: [], submissions: [] };
        }
      }
    },
  });

  const profile = data?.profile;
  const pkg = data?.activePackage;
  const coinsPerPkr = Number(data?.settings?.["coins_per_pkr"] ?? 100);
  const usdPkr = Number(data?.settings?.["usd_pkr"] ?? 280);
  const isFree = data?.profile?.active_package_id === "free" || !data?.profile;
  const todayTasks = (tasksQuery.data?.tasks ?? []).slice(0, pkg?.daily_tasks ?? 1);
  const displayName = profile?.username ?? "Danyal";

  return (
    <AppShell title="Dashboard">
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-primary">Your earning hub</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Welcome, {displayName} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep going — every task takes you closer to your goals.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatBox
            icon={Coins}
            label="Total earned"
            value={fmtCoins(profile?.total_earned ?? 0)}
            tone="purple"
          />
          <StatBox
            icon={CheckCircle2}
            label="Tasks done"
            value={String(profile?.tasks_completed ?? 0)}
            tone="green"
          />
          <StatBox icon={Gift} label="Referrals" value="0" tone="amber" />
          <StatBox
            icon={CalendarClock}
            label="Today"
            value={`${data?.today.tasks ?? 0} tasks`}
            tone="blue"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#6a1b9a] via-[#7b2cbf] to-[#2962ff] p-5 text-white shadow-xl shadow-indigo-500/20 transition-transform hover:-translate-y-1">
            <div className="absolute -right-7 -top-7 size-28 rounded-full bg-white/10" />
            <div className="relative flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/25 px-3 py-1 text-[11px] font-black tracking-widest text-amber-100 shadow-[0_0_18px_rgba(253,224,71,0.35)]">
                  <Trophy className="size-3.5" /> ACTIVE PACKAGE
                </span>
                <p className="mt-4 text-2xl font-black">{pkg?.name ?? "FREE Package"}</p>
                <p className="mt-1 text-sm text-white/80">
                  {pkg?.daily_tasks ?? 1} tasks/day ·{" "}
                  {fmtCoins(Number(pkg?.daily_earning_coins ?? 0))} coins daily
                </p>
              </div>
              {isFree && (
                <Trophy className="size-16 text-amber-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.7)]" />
              )}
            </div>
            <p className="relative mt-4 flex items-center gap-1 text-xs text-white/75">
              <CalendarClock className="size-3.5" />
              {isFree ? "Lifetime validity" : `Expires ${fmtDate(profile?.package_expires_at)}`}
            </p>
            <Button
              asChild
              size="sm"
              className="relative mt-4 rounded-xl bg-white text-indigo-700 hover:bg-white/90"
            >
              <Link to="/packages">{isFree ? "Upgrade package" : "Change package"}</Link>
            </Button>
          </div>

          <WalletCard
            icon={Wallet}
            title="Deposit Wallet"
            balance={profile?.deposit_balance ?? 0}
            coinsPerPkr={coinsPerPkr}
            color="green"
            href="/deposit"
            action="Deposit"
          />
          <WalletCard
            icon={Coins}
            title="Earning Wallet"
            balance={profile?.earning_balance ?? 0}
            coinsPerPkr={coinsPerPkr}
            usdPkr={usdPkr}
            color="blue"
            href="/withdraw"
            action="Withdraw"
          />
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md transition-shadow hover:shadow-lg">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Earned today
            </p>
            <p className="mt-3 text-3xl font-black">{fmtCoins(data?.today.coins ?? 0)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {fmtPkr(data?.today.coins ?? 0, coinsPerPkr)} · {data?.today.tasks ?? 0} tasks
              approved
            </p>
          </div>
        </div>

        <ReferralBanner code={profile?.username ?? null} />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Today&apos;s Tasks</h2>
            <Link to="/tasks" className="text-xs font-bold text-primary hover:underline">
              See all
            </Link>
          </div>
          {isFree && (
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Lock className="mr-1 inline size-4" />
              You are on the FREE package. Upgrade to unlock more tasks and higher daily earnings.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {todayTasks.map((task) => (
              <Link
                key={task.id}
                to="/task/$id"
                params={{ id: task.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3 transition-shadow hover:shadow-md"
              >
                {task.image_url && (
                  <img
                    src={task.image_url}
                    alt={task.title}
                    className="size-14 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{task.title}</p>
                  <p className="text-xs text-primary">
                    +{fmtCoins(task.reward_coins)} Coins ({fmtPkr(task.reward_coins, coinsPerPkr)})
                  </p>
                </div>
              </Link>
            ))}
            {todayTasks.length === 0 && (
              <p className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                No data yet, refresh.
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  tone: "purple" | "green" | "amber" | "blue";
}) {
  const tones = {
    purple: "bg-violet-50 text-violet-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className={`mb-3 grid size-9 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="size-4" />
      </div>
      <p className="text-xl font-black">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function WalletCard({
  icon: Icon,
  title,
  balance,
  coinsPerPkr,
  usdPkr,
  color,
  href,
  action,
}: {
  icon: typeof Wallet;
  title: string;
  balance: number;
  coinsPerPkr: number;
  usdPkr?: number;
  color: "green" | "blue";
  href: "/deposit" | "/withdraw";
  action: string;
}) {
  const green = color === "green";
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${green ? "from-[#00C853] to-[#B2FF59]" : "from-[#2962FF] to-[#82B1FF]"} p-5 text-white shadow-xl transition-transform hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-white/80">{title}</p>
        <Icon className="size-7" />
      </div>
      <p className="mt-3 text-3xl font-black">
        {fmtCoins(balance)} <span className="text-sm font-semibold">Coins</span>
      </p>
      <p className="text-sm text-white/85">
        {fmtPkr(balance, coinsPerPkr)}
        {usdPkr ? ` · ${fmtUsd(balance, coinsPerPkr, usdPkr)}` : " · for packages only"}
      </p>
      <Button
        asChild
        size="sm"
        className={`mt-4 rounded-xl bg-white font-bold ${green ? "text-emerald-700 hover:bg-white/90" : "text-blue-700 hover:bg-white/90"}`}
      >
        <Link to={href}>
          {action === "Deposit" ? (
            <ArrowDownToLine className="mr-1 size-4" />
          ) : (
            <ArrowUpFromLine className="mr-1 size-4" />
          )}
          {action}
        </Link>
      </Button>
    </div>
  );
}
