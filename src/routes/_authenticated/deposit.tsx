import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe, useRefreshMe } from "@/hooks/useMe";
import { submitDeposit } from "@/lib/app.functions";
import { uploadProof } from "@/lib/upload";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/deposit")({
  head: () => ({
    meta: [
      { title: "Deposit — PixEarn" },
      { name: "description", content: "Send payment and upload proof to top up your wallet." },
      { property: "og:title", content: "Deposit — PixEarn" },
      {
        property: "og:description",
        content: "Send payment and upload proof to top up your wallet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DepositPage,
});

const AMOUNTS = [200, 500, 1000];

function DepositPage() {
  const { data } = useMe();
  const refresh = useRefreshMe();
  const submit = useServerFn(submitDeposit);
  const s = data?.settings ?? {};

  const [amount, setAmount] = useState(200);
  const [method, setMethod] = useState<"jazzcash" | "easypaisa" | "usdt">("jazzcash");
  const [tid, setTid] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const accounts = [
    {
      id: "jazzcash" as const,
      label: "JazzCash",
      number: s["jazzcash_number"],
      title: s["jazzcash_title"],
    },
    {
      id: "easypaisa" as const,
      label: "Easypaisa",
      number: s["easypaisa_number"],
      title: s["easypaisa_title"],
    },
    {
      id: "usdt" as const,
      label: `USDT (${s["usdt_network"] ?? "BEP20"})`,
      number: s["usdt_address"],
      title: s["usdt_network"],
    },
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const path = file ? await uploadProof(file) : undefined;
      await submit({
        data: { amountPkr: amount, method, tid, ...(path ? { screenshotPath: path } : {}) },
      });
      toast.success("Deposit submitted. Admin will approve it shortly.");
      setTid("");
      setFile(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit deposit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Deposit">
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {s["deposit_instructions"] ??
            "Please send money to the correct number and upload proof. Wrong number payment will not be accepted."}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {accounts.map((acc) => (
            <div key={acc.id} className="rounded-3xl border border-border bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{acc.label}</p>
              <p className="mt-1 break-all text-sm font-bold">{acc.number ?? "Not set"}</p>
              <p className="text-xs text-muted-foreground">{acc.title ?? "—"}</p>
              {acc.number && (
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(acc.number ?? "");
                    toast.success("Copied");
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-primary"
                >
                  <Copy className="size-3" /> Copy
                </button>
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-white p-5"
        >
          <h2 className="font-bold">Submit your payment</h2>

          <div className="space-y-1.5">
            <Label>Amount (PKR)</Label>
            <div className="flex gap-2">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold",
                    amount === a
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <div className="flex gap-2">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setMethod(acc.id)}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold",
                    method === acc.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tid">Transaction ID (TID)</Label>
            <Input id="tid" value={tid} onChange={(e) => setTid(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shot">Payment screenshot</Label>
            <Input
              id="shot"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>

          <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
            {busy ? "Submitting…" : "Submit deposit"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
