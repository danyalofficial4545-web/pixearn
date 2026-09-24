import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { getHistory } from "@/lib/app.functions";
import { fmtDate } from "@/lib/money";
import { fetchWithSilentRetry } from "@/lib/query";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — PixEarn" },
      { name: "description", content: "All your deposits, withdrawals and task submissions." },
      { property: "og:title", content: "History — PixEarn" },
      {
        property: "og:description",
        content: "All your deposits, withdrawals and task submissions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
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

  return (
    <AppShell title="History">
      <div className="space-y-4">
        <Section title="Deposits">
          {(data?.deposits ?? []).map((d) => (
            <Row
              key={d.id}
              left={`${d.amount_pkr} PKR · ${d.method}`}
              sub={`TID ${d.tid} · ${fmtDate(d.created_at)}`}
              status={d.status}
            />
          ))}
        </Section>

        <Section title="Withdrawals">
          {(data?.withdrawals ?? []).map((w) => (
            <Row
              key={w.id}
              left={`${w.amount_pkr} PKR · ${w.method}`}
              sub={`${w.account_number} · ${fmtDate(w.created_at)}`}
              status={w.status}
            />
          ))}
        </Section>

        <Section title="Task submissions">
          {(data?.submissions ?? []).map((s) => (
            <Row
              key={s.id}
              left={s.tasks?.title ?? "Task"}
              sub={fmtDate(s.created_at)}
              status={s.status}
            />
          ))}
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const empty = Array.isArray(children) && children.length === 0;
  return (
    <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-white">
      <p className="px-4 py-3 text-sm font-bold">{title}</p>
      {empty ? <p className="px-4 py-4 text-sm text-muted-foreground">Nothing yet.</p> : children}
    </div>
  );
}

function Row({ left, sub, status }: { left: string; sub: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{left}</p>
        <p className="truncate text-xs text-muted-foreground">{sub}</p>
      </div>
      <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs capitalize">{status}</span>
    </div>
  );
}
