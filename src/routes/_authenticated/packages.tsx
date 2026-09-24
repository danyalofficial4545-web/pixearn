import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, Crown, Star } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useMe, useRefreshMe } from "@/hooks/useMe";
import { buyPackage } from "@/lib/app.functions";
import { fmtCoins, fmtPkr } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/packages")({
  head: () => ({
    meta: [
      { title: "Packages — PixEarn" },
      { name: "description", content: "Choose your PixEarn earning package." },
    ],
  }),
  component: PackagesPage,
});

function PackagesPage() {
  const { data } = useMe();
  const refresh = useRefreshMe();
  const buy = useServerFn(buyPackage);
  const [busy, setBusy] = useState<string | null>(null);
  const coinsPerPkr = Number(data?.settings?.["coins_per_pkr"] ?? 100);
  const activeId = data?.profile?.active_package_id;

  async function onBuy(packageId: string) {
    setBusy(packageId);
    try {
      await buy({ data: { packageId } });
      toast.success("Package activated!");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Purchase failed");
    } finally {
      setBusy(null);
    }
  }

  const packages = data?.packages ?? [];
  return (
    <AppShell title="Packages">
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 text-sm shadow-sm">
          Deposit Wallet: <b>{fmtCoins(data?.profile?.deposit_balance ?? 0)} Coins</b> (
          {fmtPkr(data?.profile?.deposit_balance ?? 0, coinsPerPkr)}) ·{" "}
          <Link to="/deposit" className="font-bold text-primary hover:underline">
            Add funds
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {packages.map((pkg) => {
            const active = pkg.id === activeId;
            const isFree = pkg.id === "free";
            const isPro = pkg.id === "p500" || pkg.sort === 3;
            const isBasic = !isFree && !isPro;
            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-lg transition-transform hover:-translate-y-1 ${isFree ? "border border-slate-200" : isBasic ? "border-2 border-emerald-400" : "border-2 border-amber-400"} ${active ? "ring-4 ring-indigo-100" : ""}`}
              >
                {isPro && (
                  <div className="absolute right-0 top-0 rounded-bl-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-xs font-black text-white">
                    <Star className="mr-1 inline size-3" /> Most Popular
                  </div>
                )}
                <div
                  className={`grid size-12 place-items-center rounded-2xl ${isFree ? "bg-slate-100 text-slate-500" : isBasic ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                >
                  {isPro ? <Crown className="size-6" /> : <Star className="size-6" />}
                </div>
                <p className="mt-5 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  {isFree ? "FREE" : isBasic ? "BASIC" : "PRO"}
                </p>
                <p className="mt-1 text-2xl font-black">{pkg.name}</p>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {fmtPkr(Number(pkg.price_coins), coinsPerPkr)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fmtCoins(Number(pkg.price_coins))} Coins
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  <Feature text="Daily tasks" value={`${pkg.daily_tasks} tasks per day`} />
                  <Feature
                    text="Earning per task"
                    value={`${fmtCoins(Math.floor(Number(pkg.daily_earning_coins) / Math.max(Number(pkg.daily_tasks), 1)))} coins`}
                  />
                  <Feature
                    text="Daily earning"
                    value={`${fmtCoins(Number(pkg.daily_earning_coins))} coins`}
                  />
                  <Feature
                    text="Validity"
                    value={pkg.validity_days ? `${pkg.validity_days} days` : "Lifetime"}
                  />
                </ul>
                {active ? (
                  <div className="mt-6 rounded-xl bg-slate-100 py-3 text-center text-sm font-black text-slate-700">
                    ✓ Active package
                  </div>
                ) : isFree ? (
                  <div className="mt-6 rounded-xl bg-slate-100 py-3 text-center text-sm font-semibold text-slate-500">
                    Default package
                  </div>
                ) : (
                  <Button
                    onClick={() => void onBuy(pkg.id)}
                    disabled={busy === pkg.id}
                    className={`mt-6 w-full rounded-xl ${isPro ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
                  >
                    {busy === pkg.id ? "Activating…" : "Buy with Deposit Wallet"}
                  </Button>
                )}
              </div>
            );
          })}
          {packages.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No data yet, refresh.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Feature({ text, value }: { text: string; value: string }) {
  return (
    <li className="flex gap-2">
      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
      <span>
        <b>{text}:</b> {value}
      </span>
    </li>
  );
}
