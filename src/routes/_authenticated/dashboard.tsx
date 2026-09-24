import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownToLine, ArrowUpFromLine, CalendarClock, Lock, Sparkles } from "lucide-react";
import { AppShell, ReferralBanner } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { getTasks } from "@/lib/app.functions";
import { fmtCoins, fmtDate, fmtPkr, fmtUsd } from "@/lib/money";

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
  const tasksQuery = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });

  const profile = data?.profile;
  const pkg = data?.activePackage;
  const coinsPerPkr = Number(data?.settings?.["coins_per_pkr"] ?? 100);
  const usdPkr = Number(data?.settings?.["usd_pkr"] ?? 280);
  const isFree = data?.profile.active_package_id === "free";
  const todayTasks = (tasksQuery.data?.tasks ?? []).slice(0, pkg?.daily_tasks ?? 1);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl brand-gradient p-5 text-white shadow-lg shadow-indigo-500/20">
            <p className="text-xs uppercase tracking-wide text-white/75">Earning Wallet</p>
            <p className="mt-1 text-3xl font-extrabold">
              {fmtCoins(profile?.earning_balance ?? 0)}
              <span className="ml-1 text-sm font-medium">Coins</span>
            </p>
            <p className="text-sm text-white/85">
              {fmtPkr(profile?.earning_balance ?? 0, coinsPerPkr)} ·{" "}
              {fmtUsd(profile?.earning_balance ?? 0, coinsPerPkr, usdPkr)}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Deposit Wallet</p>
            <p className="mt-1 text-3xl font-extrabold">
              {fmtCoins(profile?.deposit_balance ?? 0)}
              <span className="ml-1 text-sm font-medium text-muted-foreground">Coins</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {fmtPkr(profile?.deposit_balance ?? 0, coinsPerPkr)} · for packages only
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button asChild className="h-12 rounded-2xl">
            <Link to="/deposit">
              <ArrowDownToLine className="mr-1 size-4" /> Deposit
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-2xl">
            <Link to="/withdraw">
              <ArrowUpFromLine className="mr-1 size-4" /> Withdraw
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-border bg-white p-5">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Sparkles className="size-3.5" /> Active package
            </p>
            <p className="mt-1 text-xl font-bold">{pkg?.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">
              {pkg?.daily_tasks ?? 0} tasks/day · {fmtCoins(Number(pkg?.daily_earning_coins ?? 0))}{" "}
              coins daily
            </p>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" />
              {isFree ? "Lifetime validity" : `Expires ${fmtDate(profile?.package_expires_at)}`}
            </p>
            <Button asChild size="sm" variant="outline" className="mt-3 rounded-xl">
              <Link to="/packages">{isFree ? "Upgrade package" : "Change package"}</Link>
            </Button>
          </div>

          <div className="rounded-3xl border border-border bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Earned today</p>
            <p className="mt-1 text-3xl font-extrabold">{fmtCoins(data?.today.coins ?? 0)}</p>
            <p className="text-sm text-muted-foreground">
              {fmtPkr(data?.today.coins ?? 0, coinsPerPkr)} · {data?.today.tasks ?? 0} tasks
              approved
            </p>
          </div>
        </div>

        <ReferralBanner code={profile?.referral_code ?? null} />

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Today&apos;s Tasks</h2>
            <Link to="/tasks" className="text-xs text-primary hover:underline">
              See all
            </Link>
          </div>

          {isFree && (
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Lock className="mr-1 inline size-4" />
              You are on the FREE package. Please deposit &amp; buy a package to unlock more tasks
              and higher daily earnings.
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
              <p className="text-sm text-muted-foreground">No tasks available right now.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
