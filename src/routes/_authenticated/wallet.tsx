import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownToLine, ArrowUpFromLine, Coins, WalletCards } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { getHistory } from "@/lib/app.functions";
import { fmtCoins, fmtDate, fmtPkr, fmtUsd } from "@/lib/money";
import { fetchWithSilentRetry } from "@/lib/query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — PixEarn" },
      { name: "description", content: "Your PixEarn wallets and transaction history." },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const { data: me } = useMe();
  const fetchHistory = useServerFn(getHistory);
  const { data } = useQuery({
    queryKey: ["history"],
    retry: false,
    queryFn: () =>
      fetchWithSilentRetry(fetchHistory, {
        transactions: [],
        deposits: [],
        withdrawals: [],
        submissions: [],
      }),
  });
  const [tab, setTab] = useState<"deposit" | "earning">("deposit");
  const coinsPerPkr = Number(me?.settings?.["coins_per_pkr"] ?? 100);
  const usdPkr = Number(me?.settings?.["usd_pkr"] ?? 280);
  const balance =
    tab === "deposit" ? (me?.profile?.deposit_balance ?? 0) : (me?.profile?.earning_balance ?? 0);
  const rows = (data?.transactions ?? []).filter((t) => t.wallet === tab);

  return (
    <AppShell title="Wallet">
      <div className="space-y-5">
        <div className="flex gap-2 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm">
          {(["deposit", "earning"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-xl px-3 py-2 text-sm font-bold capitalize",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t} Wallet
            </button>
          ))}
        </div>
        <div
          className={`rounded-3xl p-6 text-white shadow-xl transition-all hover:-translate-y-1 ${tab === "deposit" ? "bg-gradient-to-br from-[#00C853] to-[#AED581] shadow-green-500/20" : "bg-gradient-to-br from-[#2962FF] to-[#82B1FF] shadow-blue-500/20"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/80">
                {tab === "deposit" ? "Deposit Wallet" : "Earning Wallet"}
              </p>
              <p className="mt-3 text-4xl font-black">
                {fmtCoins(balance)} <span className="text-sm">Coins</span>
              </p>
              <p className="mt-1 text-sm text-white/85">
                {fmtPkr(balance, coinsPerPkr)} · {fmtUsd(balance, coinsPerPkr, usdPkr)}
              </p>
            </div>
            {tab === "deposit" ? (
              <WalletCards className="size-12" />
            ) : (
              <Coins className="size-12" />
            )}
          </div>
          <p className="mt-4 text-xs text-white/80">
            {tab === "deposit"
              ? "Used only to buy packages. Cannot be withdrawn."
              : "Tasks and referrals. Withdrawals come from here."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            asChild
            className="h-12 rounded-2xl bg-emerald-600 font-black hover:bg-emerald-700"
          >
            <Link to="/deposit">
              <ArrowDownToLine className="mr-2 size-4" /> Deposit
            </Link>
          </Button>
          <Button
            asChild
            className="h-12 rounded-2xl bg-blue-600 font-black text-white hover:bg-blue-700"
          >
            <Link to="/withdraw">
              <ArrowUpFromLine className="mr-2 size-4" /> Withdraw
            </Link>
          </Button>
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
          <p className="px-5 py-4 text-sm font-black">
            {tab === "deposit" ? "Deposit" : "Earning"} activity
          </p>
          {rows.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">No activity yet.</p>
          )}
          {rows.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{t.note ?? t.type}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(t.created_at)}</p>
              </div>
              <p
                className={cn(
                  "shrink-0 text-sm font-black",
                  t.coins >= 0 ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {t.coins >= 0 ? "+" : ""}
                {fmtCoins(t.coins)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
