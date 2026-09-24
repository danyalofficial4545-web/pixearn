import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe } from "@/hooks/useMe";
import {
  adminOverview,
  adminReviewDeposit,
  adminReviewProof,
  adminReviewWithdrawal,
  adminSaveSettings,
  adminSaveTask,
  adminUpdateUser,
} from "@/lib/admin.functions";
import { fmtCoins, fmtDate } from "@/lib/money";
import { cn } from "@/lib/utils";
import { fetchWithSilentRetry } from "@/lib/query";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — PixEarn" },
      { name: "description", content: "Manage users, deposits, withdrawals, tasks and settings." },
      { property: "og:title", content: "Admin panel — PixEarn" },
      {
        property: "og:description",
        content: "Manage users, deposits, withdrawals, tasks and settings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const TABS = [
  "Overview",
  "Deposits",
  "Withdrawals",
  "Proofs",
  "Tasks",
  "Users",
  "Settings",
] as const;

function AdminPage() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchOverview = useServerFn(adminOverview);
  const reviewDeposit = useServerFn(adminReviewDeposit);
  const reviewWithdrawal = useServerFn(adminReviewWithdrawal);
  const reviewProof = useServerFn(adminReviewProof);
  const saveSettings = useServerFn(adminSaveSettings);
  const saveTask = useServerFn(adminSaveTask);
  const updateUser = useServerFn(adminUpdateUser);

  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const { data } = useQuery({
    queryKey: ["admin"],
    queryFn: () =>
      fetchWithSilentRetry(fetchOverview, {
        users: [],
        deposits: [],
        withdrawals: [],
        submissions: [],
        tasks: [],
        settings: {},
        stats: {
          users: 0,
          approvedDepositsPkr: 0,
          paidWithdrawPkr: 0,
          pendingDeposits: 0,
          pendingWithdrawals: 0,
          pendingProofs: 0,
        },
      }),
    enabled: me?.isAdmin === true,
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin"] });
    void qc.invalidateQueries({ queryKey: ["me"] });
  };

  async function run(fn: () => Promise<unknown>, message: string) {
    try {
      await fn();
      toast.success(message);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  }

  useEffect(() => {
    if (me && !me.isAdmin) {
      toast.error("Admins only");
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [me, navigate]);

  if (me && !me.isAdmin) {
    return (
      <AppShell title="Admin">
        <p className="rounded-3xl border border-border bg-white p-6 text-sm text-muted-foreground">
          Redirecting…
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin panel">
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold",
                tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Overview" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Users" value={String(data?.stats.users ?? 0)} />
            <Stat label="Deposits approved" value={`${data?.stats.approvedDepositsPkr ?? 0} PKR`} />
            <Stat label="Withdrawals paid" value={`${data?.stats.paidWithdrawPkr ?? 0} PKR`} />
            <Stat
              label="Estimated profit"
              value={`${(data?.stats.approvedDepositsPkr ?? 0) - (data?.stats.paidWithdrawPkr ?? 0)} PKR`}
            />
            <Stat label="Pending deposits" value={String(data?.stats.pendingDeposits ?? 0)} />
            <Stat
              label="Pending withdrawals / proofs"
              value={`${data?.stats.pendingWithdrawals ?? 0} / ${data?.stats.pendingProofs ?? 0}`}
            />
          </div>
        )}

        {tab === "Deposits" &&
          (data?.deposits ?? []).map((d) => (
            <ReviewCard
              key={d.id}
              title={`@${d.profiles?.username ?? "user"} · ${d.amount_pkr} PKR (${d.method})`}
              sub={`TID ${d.tid} · ${fmtDate(d.created_at)}`}
              status={d.status}
              onApprove={() =>
                run(() => reviewDeposit({ data: { id: d.id, approve: true } }), "Deposit approved")
              }
              onReject={() =>
                run(() => reviewDeposit({ data: { id: d.id, approve: false } }), "Deposit rejected")
              }
            />
          ))}

        {tab === "Withdrawals" &&
          (data?.withdrawals ?? []).map((w) => (
            <ReviewCard
              key={w.id}
              title={`@${w.profiles?.username ?? "user"} · ${w.amount_pkr} PKR (${w.method})`}
              sub={`${w.account_title} · ${w.account_number} · ${fmtDate(w.created_at)}`}
              status={w.status}
              onApprove={() =>
                run(
                  () => reviewWithdrawal({ data: { id: w.id, approve: true } }),
                  "Withdrawal marked paid",
                )
              }
              onReject={() =>
                run(
                  () => reviewWithdrawal({ data: { id: w.id, approve: false } }),
                  "Withdrawal rejected and refunded",
                )
              }
            />
          ))}

        {tab === "Proofs" &&
          (data?.submissions ?? []).map((s) => (
            <ReviewCard
              key={s.id}
              title={`@${s.profiles?.username ?? "user"} · ${s.tasks?.title ?? "Task"}`}
              sub={`Game ID ${s.game_user_id} · ${fmtCoins(Number(s.tasks?.reward_coins ?? 0))} coins · ${fmtDate(s.created_at)}`}
              status={s.status}
              onApprove={() =>
                run(() => reviewProof({ data: { id: s.id, approve: true } }), "Proof approved")
              }
              onReject={() =>
                run(() => reviewProof({ data: { id: s.id, approve: false } }), "Proof rejected")
              }
            />
          ))}

        {tab === "Tasks" && (
          <TaskEditor
            tasks={data?.tasks ?? []}
            onSave={(payload) => run(() => saveTask({ data: payload }), "Task saved")}
          />
        )}

        {tab === "Users" &&
          (data?.users ?? []).map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">@{u.username}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email} · {u.package_id} · Deposit {fmtCoins(u.deposit_balance)} · Earning{" "}
                  {fmtCoins(u.earning_balance)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    const value = window.prompt(
                      "Set earning wallet coins",
                      String(u.earning_balance),
                    );
                    if (value === null) return;
                    void run(
                      () =>
                        updateUser({
                          data: { id: u.id, earning_balance: Math.max(0, Number(value)) },
                        }),
                      "User updated",
                    );
                  }}
                >
                  Edit earning
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    const value = window.prompt(
                      "Set deposit wallet coins",
                      String(u.deposit_balance),
                    );
                    if (value === null) return;
                    void run(
                      () =>
                        updateUser({
                          data: { id: u.id, deposit_balance: Math.max(0, Number(value)) },
                        }),
                      "User updated",
                    );
                  }}
                >
                  Edit deposit
                </Button>
                <Button
                  size="sm"
                  variant={u.banned ? "default" : "destructive"}
                  className="rounded-xl"
                  onClick={() =>
                    run(
                      () => updateUser({ data: { id: u.id, banned: !u.banned } }),
                      u.banned ? "User unbanned" : "User banned",
                    )
                  }
                >
                  {u.banned ? "Unban" : "Ban"}
                </Button>
              </div>
            </div>
          ))}

        {tab === "Settings" && (
          <SettingsEditor
            settings={data?.settings ?? {}}
            onSave={(values) => run(() => saveSettings({ data: { values } }), "Settings saved")}
          />
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}

function ReviewCard({
  title,
  sub,
  status,
  onApprove,
  onReject,
}: {
  title: string;
  sub: string;
  status: string;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{sub}</p>
      </div>
      {status === "pending" ? (
        <div className="flex gap-2">
          <Button size="sm" className="rounded-xl" onClick={onApprove}>
            Approve
          </Button>
          <Button size="sm" variant="destructive" className="rounded-xl" onClick={onReject}>
            Reject
          </Button>
        </div>
      ) : (
        <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize">{status}</span>
      )}
    </div>
  );
}

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  play_store_link: string | null;
  reward_coins: number | string;
  profit_coins: number | string;
  active: boolean;
};

function TaskEditor({
  tasks,
  onSave,
}: {
  tasks: TaskRow[];
  onSave: (payload: {
    id?: string;
    title: string;
    description: string;
    image_url?: string;
    play_store_link?: string;
    reward_coins: number;
    profit_coins: number;
    active: boolean;
  }) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    play_store_link: "",
    reward_coins: 1000,
    profit_coins: 0,
  });

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            title: form.title,
            description: form.description,
            image_url: form.image_url,
            play_store_link: form.play_store_link,
            reward_coins: Number(form.reward_coins),
            profit_coins: Number(form.profit_coins),
            active: true,
          });
          setForm({ ...form, title: "", description: "", image_url: "", play_store_link: "" });
        }}
        className="space-y-3 rounded-3xl border border-border bg-white p-5"
      >
        <h2 className="font-bold">Create task</h2>
        <Field
          label="Title / game name"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
        />
        <Field
          label="Description / steps"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <Field
          label="Image URL"
          value={form.image_url}
          onChange={(v) => setForm({ ...form, image_url: v })}
        />
        <Field
          label="Play Store link"
          value={form.play_store_link}
          onChange={(v) => setForm({ ...form, play_store_link: v })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Reward coins (user)"
            value={String(form.reward_coins)}
            onChange={(v) => setForm({ ...form, reward_coins: Number(v) })}
          />
          <Field
            label="My profit coins (hidden)"
            value={String(form.profit_coins)}
            onChange={(v) => setForm({ ...form, profit_coins: Number(v) })}
          />
        </div>
        <Button type="submit" className="rounded-xl">
          Save task
        </Button>
      </form>

      {tasks.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-white p-4"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{t.title}</p>
            <p className="text-xs text-muted-foreground">
              {fmtCoins(Number(t.reward_coins))} coins · {t.active ? "Active" : "Inactive"}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={() =>
              onSave({
                id: t.id,
                title: t.title,
                description: t.description ?? "",
                image_url: t.image_url ?? "",
                play_store_link: t.play_store_link ?? "",
                reward_coins: Number(t.reward_coins),
                profit_coins: Number(t.profit_coins),
                active: !t.active,
              })
            }
          >
            {t.active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      ))}
    </div>
  );
}

const SETTING_FIELDS: { key: string; label: string }[] = [
  { key: "jazzcash_number", label: "JazzCash number" },
  { key: "jazzcash_title", label: "JazzCash account title" },
  { key: "easypaisa_number", label: "Easypaisa number" },
  { key: "easypaisa_title", label: "Easypaisa account title" },
  { key: "usdt_address", label: "USDT address" },
  { key: "usdt_network", label: "USDT network" },
  { key: "deposit_instructions", label: "Deposit instructions" },
  { key: "coins_per_pkr", label: "Coins per PKR" },
  { key: "usd_pkr", label: "USD to PKR rate" },
  { key: "timewall_wall_id", label: "Timewall wall ID" },
  { key: "timewall_percent", label: "Timewall user share (%)" },
  { key: "timewall_secret", label: "Timewall postback secret" },
  { key: "referral_level1_percent", label: "Referral package %" },
  { key: "referral_level2_percent", label: "Referral task %" },
];

function SettingsEditor({
  settings,
  onSave,
}: {
  settings: Record<string, string>;
  onSave: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(settings);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(values);
      }}
      className="space-y-3 rounded-3xl border border-border bg-white p-5"
    >
      {SETTING_FIELDS.map((f) => (
        <Field
          key={f.key}
          label={f.label}
          value={values[f.key] ?? settings[f.key] ?? ""}
          onChange={(v) => setValues({ ...values, [f.key]: v })}
        />
      ))}
      <p className="text-xs text-muted-foreground">
        Postback URL:{" "}
        <code>
          /api/public/postback?userId=&#123;uid&#125;&amp;coins=&#123;amount&#125;&amp;secret=YOUR_SECRET
        </code>
      </p>
      <Button type="submit" className="rounded-xl">
        Save settings
      </Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
