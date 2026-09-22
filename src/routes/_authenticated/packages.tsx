import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useMe, useRefreshMe } from "@/hooks/useMe";
import { buyPackage } from "@/lib/app.functions";
import { fmtCoins, fmtPkr } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/packages")({
  head: () => ({
    meta: [
      { title: "Packages — PixEarn" },
      { name: "description", content: "Buy a package with your Deposit Wallet to unlock tasks." },
      { property: "og:title", content: "Packages — PixEarn" },
      {
        property: "og:description",
        content: "Buy a package with your Deposit Wallet to unlock tasks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const activeId = data?.profile.active_package_id;

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

  return (
    <AppShell title="Packages">
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm">
          Deposit Wallet: <b>{fmtCoins(data?.profile.deposit_balance ?? 0)} Coins</b> (
          {fmtPkr(data?.profile.deposit_balance ?? 0, coinsPerPkr)}) ·{" "}
          <Link to="/deposit" className="text-primary hover:underline">
            Add funds
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {(data?.packages ?? []).map((pkg) => {
            const active = pkg.id === activeId;
            return (
              <div
                key={pkg.id}
                className={
                  active
                    ? "rounded-3xl brand-gradient p-5 text-white shadow-lg shadow-indigo-500/20"
                    : "rounded-3xl border border-border bg-white p-5"
                }
              >
                <p className="text-sm font-semibold opacity-80">{pkg.name}</p>
                <p className="mt-1 text-2xl font-extrabold">
                  {fmtPkr(Number(pkg.price_coins), coinsPerPkr)}
                </p>
                <p className={active ? "text-xs text-white/80" : "text-xs text-muted-foreground"}>
                  {fmtCoins(Number(pkg.price_coins))} Coins
                </p>
                <ul
                  className={`mt-4 space-y-1.5 text-sm ${active ? "" : "text-muted-foreground"}`}
                >
                  <li>{pkg.daily_tasks} tasks per day</li>
                  <li>{fmtCoins(Number(pkg.daily_earning_coins))} coins daily</li>
                  <li>{pkg.validity_days ? `${pkg.validity_days} days` : "Lifetime"}</li>
                  <li>
                    Min withdraw {fmtPkr(Number(pkg.min_withdraw_coins), coinsPerPkr)}
                  </li>
                </ul>
                {active ? (
                  <p className="mt-5 flex items-center gap-1 text-sm font-semibold">
                    <Check className="size-4" /> Active
                  </p>
                ) : pkg.id === "free" ? (
                  <p className="mt-5 text-sm text-muted-foreground">Default package</p>
                ) : (
                  <Button
                    onClick={() => onBuy(pkg.id)}
                    disabled={busy === pkg.id}
                    className="mt-5 w-full rounded-xl"
                  >
                    {busy === pkg.id ? "Activating…" : "Buy with Deposit Wallet"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
