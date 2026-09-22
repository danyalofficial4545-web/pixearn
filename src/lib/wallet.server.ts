import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function getSettings() {
  const { data } = await supabaseAdmin.from("settings").select("key,value");
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

export async function logTx(
  userId: string,
  wallet: "deposit" | "earning",
  type: string,
  coins: number,
  note?: string,
) {
  await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    wallet,
    type,
    coins,
    note: note ?? null,
  });
}

export async function addDepositCoins(userId: string, coins: number, note: string) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("deposit_balance")
    .eq("id", userId)
    .single();
  if (!profile) throw new Error("Profile not found");
  await supabaseAdmin
    .from("profiles")
    .update({ deposit_balance: Number(profile.deposit_balance) + coins })
    .eq("id", userId);
  await logTx(userId, "deposit", coins >= 0 ? "deposit_in" : "deposit_out", coins, note);
}

/** Credits the earning wallet and pays the 5% referral override on task income. */
export async function addEarningCoins(
  userId: string,
  coins: number,
  type: string,
  note: string,
  opts: { payReferral?: boolean } = {},
) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("earning_balance,total_earned,referred_by,created_at")
    .eq("id", userId)
    .single();
  if (!profile) throw new Error("Profile not found");

  await supabaseAdmin
    .from("profiles")
    .update({
      earning_balance: Number(profile.earning_balance) + coins,
      total_earned: Number(profile.total_earned) + Math.max(coins, 0),
    })
    .eq("id", userId);
  await logTx(userId, "earning", type, coins, note);

  if (opts.payReferral && coins > 0 && profile.referred_by) {
    const joined = new Date(profile.created_at).getTime();
    const withinWindow = Date.now() - joined <= 30 * 24 * 60 * 60 * 1000;
    if (withinWindow) {
      const settings = await getSettings();
      const pct = Number(settings["referral_level2_percent"] ?? 5);
      const bonus = Math.floor((coins * pct) / 100);
      if (bonus > 0) {
        await addEarningCoins(
          profile.referred_by,
          bonus,
          "referral_task",
          `${pct}% referral bonus from downline task earning`,
        );
        await supabaseAdmin.from("referral_earnings").insert({
          referrer_id: profile.referred_by,
          from_user_id: userId,
          kind: "task",
          coins: bonus,
        });
      }
    }
  }
}

export async function bumpDaily(userId: string, coins: number, tasks: number) {
  const day = new Date().toISOString().slice(0, 10);
  const { data } = await supabaseAdmin
    .from("daily_earnings")
    .select("coins,tasks")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();
  if (data) {
    await supabaseAdmin
      .from("daily_earnings")
      .update({ coins: Number(data.coins) + coins, tasks: data.tasks + tasks })
      .eq("user_id", userId)
      .eq("day", day);
  } else {
    await supabaseAdmin.from("daily_earnings").insert({ user_id: userId, day, coins, tasks });
  }
}

export async function requireAdmin(supabase: {
  rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => Promise<{ data: unknown }>;
}, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}
