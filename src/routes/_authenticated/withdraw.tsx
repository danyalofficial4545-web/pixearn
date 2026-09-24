import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe, useRefreshMe } from "@/hooks/useMe";
import { submitWithdraw } from "@/lib/app.functions";
import { fmtCoins, fmtPkr } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — PixEarn" },
      {
        name: "description",
        content: "Cash out your earning wallet to JazzCash, Easypaisa or USDT.",
      },
      { property: "og:title", content: "Withdraw — PixEarn" },
      {
        property: "og:description",
        content: "Cash out your earning wallet to JazzCash, Easypaisa or USDT.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WithdrawPage,
});

const METHODS = [
  { id: "jazzcash", label: "JazzCash" },
  { id: "easypaisa", label: "Easypaisa" },
  { id: "usdt_bep20", label: "USDT BEP20" },
  { id: "usdt_trc20", label: "USDT TRC20" },
] as const;

function WithdrawPage() {
  const { data } = useMe();
  const refresh = useRefreshMe();
  const submit = useServerFn(submitWithdraw);

  const coinsPerPkr = Number(data?.settings?.["coins_per_pkr"] ?? 100);
  const pkg = data?.activePackage;
  const options = (pkg?.withdraw_options ?? []) as number[];
  const balance = data?.profile?.earning_balance ?? 0;

  const [amount, setAmount] = useState<number | null>(null);
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("jazzcash");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) {
      toast.error("Choose an amount");
      return;
    }
    setBusy(true);
    try {
      await submit({ data: { amountPkr: amount, method, accountTitle, accountNumber } });
      toast.success("Withdrawal requested. Admin will process it soon.");
      setAmount(null);
      setAccountTitle("");
      setAccountNumber("");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not request withdrawal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Withdraw">
      <div className="space-y-4">
        <div className="rounded-3xl brand-gradient p-5 text-white shadow-lg shadow-indigo-500/20">
          <p className="text-xs uppercase tracking-wide text-white/75">Earning Wallet</p>
          <p className="mt-1 text-3xl font-extrabold">{fmtCoins(balance)} Coins</p>
          <p className="text-sm text-white/85">{fmtPkr(balance, coinsPerPkr)}</p>
        </div>

        <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm">
          On <b>{pkg?.name}</b> the minimum withdrawal is{" "}
          <b>{fmtPkr(Number(pkg?.min_withdraw_coins ?? 0), coinsPerPkr)}</b>. Deposit Wallet coins
          can never be withdrawn.
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-white p-5"
        >
          <div className="space-y-1.5">
            <Label>Choose amount</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {options.map((opt) => {
                const enough = balance >= opt * coinsPerPkr;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={!enough}
                    onClick={() => setAmount(opt)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm font-semibold disabled:opacity-40",
                      amount === opt
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {opt} PKR
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Method</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-xs font-semibold",
                    method === m.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Account title / name</Label>
            <Input
              id="title"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="number">
              {method.startsWith("usdt") ? "Wallet address" : "Mobile account number"}
            </Label>
            <Input
              id="number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
            {busy ? "Submitting…" : "Request withdrawal"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
