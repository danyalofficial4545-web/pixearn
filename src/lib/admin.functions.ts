import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = {
  userId: string;
  supabase: { rpc: (fn: string, args: unknown) => Promise<{ data: unknown }> };
};

async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (data) return;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email,username")
    .eq("id", context.userId)
    .maybeSingle();
  const designatedAdmin =
    profile?.email?.toLowerCase() === "muhammaddanyal4949@gmail.com" ||
    profile?.username?.toLowerCase() === "danyal955" ||
    profile?.email?.toLowerCase() === "muhammaddanyal4990@gmail.com" ||
    profile?.email?.toLowerCase() === "muhammaddanyal4545@gmail.com" ||
    profile?.username?.toLowerCase() === "danyal955163";
  if (!designatedAdmin) throw new Error("Forbidden");
}

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [users, deposits, withdrawals, submissions, settings, adminSettings, tasks] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
        supabaseAdmin
          .from("deposits")
          .select("*, profiles(username)")
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("withdrawals")
          .select("*, profiles(username)")
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("task_submissions")
          .select("*, profiles(username), tasks(title,reward_coins)")
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("settings").select("key,value"),
        supabaseAdmin.from("admin_settings").select("key,value"),
        supabaseAdmin.from("tasks").select("*").order("created_at", { ascending: false }),
      ]);

    const settingsMap: Record<string, string> = {};
    for (const row of settings.data ?? []) settingsMap[row.key] = row.value;
    for (const row of adminSettings.data ?? []) settingsMap[row.key] = row.value;

    const userRows = (users.data ?? []).map((u) => ({
      ...u,
      deposit_balance: Number(u.deposit_balance),
      earning_balance: Number(u.earning_balance),
      total_earned: Number(u.total_earned),
    }));

    return {
      users: userRows,
      deposits: deposits.data ?? [],
      withdrawals: withdrawals.data ?? [],
      submissions: submissions.data ?? [],
      tasks: tasks.data ?? [],
      settings: settingsMap,
      stats: {
        users: userRows.length,
        approvedDepositsPkr: (deposits.data ?? [])
          .filter((d) => d.status === "approved")
          .reduce((s, d) => s + d.amount_pkr, 0),
        paidWithdrawPkr: (withdrawals.data ?? [])
          .filter((w) => w.status === "approved")
          .reduce((s, w) => s + w.amount_pkr, 0),
        pendingDeposits: (deposits.data ?? []).filter((d) => d.status === "pending").length,
        pendingWithdrawals: (withdrawals.data ?? []).filter((w) => w.status === "pending").length,
        pendingProofs: (submissions.data ?? []).filter((s) => s.status === "pending").length,
      },
    };
  });

export const adminReviewDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), approve: z.boolean(), note: z.string().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { addDepositCoins } = await import("./wallet.server");
    const { data: dep } = await supabaseAdmin
      .from("deposits")
      .select("*")
      .eq("id", data.id)
      .single();
    if (!dep || dep.status !== "pending") throw new Error("Deposit already reviewed");

    await supabaseAdmin
      .from("deposits")
      .update({ status: data.approve ? "approved" : "rejected", admin_note: data.note ?? null })
      .eq("id", data.id);

    if (data.approve) {
      await addDepositCoins(
        dep.user_id,
        Number(dep.coins),
        `Deposit ${dep.amount_pkr} PKR approved`,
      );
    }
    return { ok: true };
  });

export const adminReviewWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), approve: z.boolean(), note: z.string().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { addEarningCoins, payWithdrawalReferral } = await import("./wallet.server");
    const { data: w } = await supabaseAdmin
      .from("withdrawals")
      .select("*")
      .eq("id", data.id)
      .single();
    if (!w || w.status !== "pending") throw new Error("Withdrawal already reviewed");

    await supabaseAdmin
      .from("withdrawals")
      .update({ status: data.approve ? "approved" : "rejected", admin_note: data.note ?? null })
      .eq("id", data.id);

    if (!data.approve) {
      // refund the reserved coins back to the earning wallet
      await addEarningCoins(w.user_id, Number(w.coins), "withdraw_refund", "Withdrawal rejected");
    } else {
      await payWithdrawalReferral(w.user_id, Number(w.coins));
    }
    return { ok: true };
  });

export const adminReviewProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), approve: z.boolean(), note: z.string().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { addEarningCoins, bumpDaily } = await import("./wallet.server");
    const { data: sub } = await supabaseAdmin
      .from("task_submissions")
      .select("*, tasks(title,reward_coins)")
      .eq("id", data.id)
      .single();
    if (!sub || sub.status !== "pending") throw new Error("Proof already reviewed");

    await supabaseAdmin
      .from("task_submissions")
      .update({ status: data.approve ? "approved" : "rejected", admin_note: data.note ?? null })
      .eq("id", data.id);

    if (data.approve) {
      const reward = Number(sub.tasks?.reward_coins ?? 0);
      await addEarningCoins(sub.user_id, reward, "task_reward", `Task: ${sub.tasks?.title}`, {
        payReferral: true,
      });
      await bumpDaily(sub.user_id, reward, 1);
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("tasks_completed")
        .eq("id", sub.user_id)
        .single();
      await supabaseAdmin
        .from("profiles")
        .update({ tasks_completed: (p?.tasks_completed ?? 0) + 1 })
        .eq("id", sub.user_id);
    }
    return { ok: true };
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ values: z.record(z.string(), z.string()) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const [key, value] of Object.entries(data.values)) {
      const table = key === "timewall_secret" ? "admin_settings" : "settings";
      await supabaseAdmin.from(table).upsert({ key, value });
    }
    return { ok: true };
  });

export const adminSaveTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().min(2),
        description: z.string().default(""),
        image_url: z.string().optional(),
        play_store_link: z.string().optional(),
        reward_coins: z.number().int().min(0),
        profit_coins: z.number().int().min(0),
        active: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...fields } = data;
    const row = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined),
    ) as never;
    if (id) {
      await supabaseAdmin.from("tasks").update(row).eq("id", id);
    } else {
      await supabaseAdmin.from("tasks").insert(row);
    }
    return { ok: true };
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        deposit_balance: z.number().int().min(0).optional(),
        earning_balance: z.number().int().min(0).optional(),
        banned: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const row = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    ) as never;
    await supabaseAdmin.from("profiles").update(row).eq("id", id);
    return { ok: true };
  });
