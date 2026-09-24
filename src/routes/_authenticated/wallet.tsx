import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/hooks/useMe";
import { getHistory } from "@/lib/app.functions";
import { fmtCoins, fmtDate, fmtPkr, fmtUsd } from "@/lib/money";
import { cn } from "@/lib/utils";
import { withQueryTimeout } from "@/lib/query";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — PixEarn" },
      { name: "description", content: "Your deposit wallet and earning wallet with full history." },
      { property: "og:title", content: "Wallet — PixEarn" },
      {
        property: "og:description",
        content: "Your deposit wallet and earning wallet with full history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    queryFn: () => withQueryTimeout(fetchHistory()),
  });
  const [tab, setTab] = useState<"deposit" | "earning">("deposit");

  const coinsPerPkr = Number(me?.settings?.["coins_per_pkr"] ?? 100);
  const usdPkr = Number(me?.settings?.["usd_pkr"] ?? 280);
  const balance =
    tab === "deposit" ? (me?.profile.deposit_balance ?? 0) : (me?.profile.earning_balance ?? 0);
  const rows = (data?.transactions ?? []).filter((t) => t.wallet === tab);

  return (
    <AppShell title="Wallet">
      <div className="space-y-4">
        <div className="flex gap-2 rounded-2xl border border-border bg-white p-1.5">
          {(["deposit", "earning"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-xl px-3 py-2 text-sm font-semibold capitalize",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t} Wallet
            </button>
          ))}
        </div>

        <div className="rounded-3xl brand-gradient p-5 text-white shadow-lg shadow-indigo-500/20">
          <p className="text-xs uppercase tracking-wide text-white/75">{tab} balance</p>
          <p className="mt-1 text-3xl font-extrabold">{fmtCoins(balance)} Coins</p>
          <p className="text-sm text-white/85">
            {fmtPkr(balance, coinsPerPkr)} · {fmtUsd(balance, coinsPerPkr, usdPkr)}
          </p>
          <p className="mt-2 text-xs text-white/75">
            {tab === "deposit"
              ? "Used only to buy packages. Cannot be withdrawn."
              : "Tasks and referrals. Withdrawals come from here."}
          </p>
        </div>

        <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-white">
          {rows.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">No activity yet.</p>
          )}
          {rows.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.note ?? t.type}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(t.created_at)}</p>
              </div>
              <p
                className={cn(
                  "shrink-0 text-sm font-bold",
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
