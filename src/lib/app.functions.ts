import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PERMANENT_ADMIN_EMAILS = [
  "muhammaddanyal4949@gmail.com",
  "muhammaddanyal4545@gmail.com",
] as const;
export const PERMANENT_ADMIN_USERNAMES = ["danyal955", "danyal955163"] as const;

function isPermanentAdmin(email: string, username: string) {
  return (
    PERMANENT_ADMIN_EMAILS.includes(email as (typeof PERMANENT_ADMIN_EMAILS)[number]) ||
    PERMANENT_ADMIN_USERNAMES.includes(username as (typeof PERMANENT_ADMIN_USERNAMES)[number])
  );
}

/** Package the user effectively has right now (expired paid packages fall back to free). */
function effectivePackageId(packageId: string, expiresAt: string | null) {
  if (packageId === "free") return "free";
  if (!expiresAt || new Date(expiresAt).getTime() < Date.now()) return "free";
  return packageId;
}

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const { data: authData } = await context.supabase.auth.getUser();

    const [profileResult, packagesResult, settingsResult, rolesResult] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", userId).single(),
      supabaseAdmin.from("packages").select("*").order("sort"),
      supabaseAdmin.from("settings").select("key,value"),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    ]);

    let profile = profileResult.data;
    if (profileResult.error || !profile) {
      const email = authData.user?.email?.trim().toLowerCase() ?? "";
      const metadataUsername =
        typeof authData.user?.user_metadata?.["username"] === "string"
          ? authData.user.user_metadata["username"].trim().toLowerCase()
          : "";
      const username = metadataUsername || email.split("@")[0] || `user_${userId.slice(0, 8)}`;
      const { data: recovered, error: recoveryError } = await supabaseAdmin
        .from("profiles")
        .upsert({ id: userId, email, username, referral_code: username }, { onConflict: "id" })
        .select("*")
        .single();
      if (recoveryError || !recovered) {
        console.error("PixEarn: profile query failed", profileResult.error, recoveryError);
        throw new Error("Profile could not be loaded");
      }
      profile = recovered;
    }
    if (packagesResult.error) console.error("PixEarn: packages query failed", packagesResult.error);
    if (settingsResult.error) console.error("PixEarn: settings query failed", settingsResult.error);
    if (rolesResult.error) console.error("PixEarn: roles query failed", rolesResult.error);

    const packages = packagesResult.data;
    const settingsRows = settingsResult.data;
    const roles = rolesResult.data;

    if (!profile) throw new Error("Profile not found");

    const designatedAdmin = isPermanentAdmin(
      profile.email?.toLowerCase() ?? "",
      profile.username?.toLowerCase() ?? "",
    );
    if (designatedAdmin) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
      if (roleError) console.error("PixEarn: admin role sync failed", roleError);
    }

    if (profile.username && profile.referral_code !== profile.username) {
      const { error: referralError } = await supabaseAdmin
        .from("profiles")
        .update({ referral_code: profile.username })
        .eq("id", userId);
      if (referralError) console.error("PixEarn: referral code sync failed", referralError);
      else profile.referral_code = profile.username;
    }

    const day = new Date().toISOString().slice(0, 10);
    const { data: daily, error: dailyError } = await supabaseAdmin
      .from("daily_earnings")
      .select("coins,tasks")
      .eq("user_id", userId)
      .eq("day", day)
      .maybeSingle();
    if (dailyError) console.error("PixEarn: daily earnings query failed", dailyError);

    const settings: Record<string, string> = {};
    for (const row of settingsRows ?? []) settings[row.key] = row.value;

    const activeId = effectivePackageId(profile.package_id, profile.package_expires_at);
    const activePackage = (packages ?? []).find((p) => p.id === activeId) ?? null;

    return {
      profile: {
        ...profile,
        deposit_balance: Number(profile.deposit_balance),
        earning_balance: Number(profile.earning_balance),
        total_earned: Number(profile.total_earned),
        active_package_id: activeId,
      },
      packages: packages ?? [],
      activePackage,
      settings,
      isAdmin: designatedAdmin || (roles ?? []).some((r) => r.role === "admin"),
      today: { coins: Number(daily?.coins ?? 0), tasks: daily?.tasks ?? 0 },
    };
  });

/** Resolve a username referral and normalize the profile immediately after signup. */
export const completeRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ referralUsername: z.string().trim().max(80).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const { data: authUser } = await context.supabase.auth.getUser();
    const email = authUser.user?.email?.trim().toLowerCase() ?? "";
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id,email,username,referral_code,referred_by")
      .eq("id", userId)
      .maybeSingle();
    if (profileError || !profile) throw new Error("Profile could not be initialized");

    const username = profile.username.trim().toLowerCase();
    const patch: { referral_code: string; referred_by?: string | null } = {
      referral_code: username,
    };
    if (!profile.referred_by && data.referralUsername) {
      const referralUsername = data.referralUsername.trim().toLowerCase();
      if (referralUsername && referralUsername !== username) {
        const { data: referrer } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .ilike("username", referralUsername)
          .maybeSingle();
        if (referrer && referrer.id !== userId) patch.referred_by = referrer.id;
      }
    }
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(patch)
      .eq("id", userId);
    if (updateError) throw new Error("Profile could not be initialized");

    const designatedAdmin = isPermanentAdmin(email, username);
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: userId, role: designatedAdmin ? "admin" : "user" },
        { onConflict: "user_id,role" },
      );
    if (roleError) console.error("PixEarn: role sync failed", roleError);
    await handleReferralBonus(userId, patch.referred_by ?? profile.referred_by);
    return {
      ok: true,
      referralCode: username,
      referredBy: patch.referred_by ?? profile.referred_by,
    };
  });

export async function handleReferralBonus(userId: string, referrerId: string | null | undefined) {
  // Rewards are intentionally deferred; this is the single extension point for
  // the planned 20 PKR reward per successful referral.
  void userId;
  void referrerId;
}

export const buyPackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ packageId: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { addEarningCoins, logTx, getSettings } = await import("./wallet.server");
    const userId = context.userId;

    const { data: pkg } = await supabaseAdmin
      .from("packages")
      .select("*")
      .eq("id", data.packageId)
      .single();
    if (!pkg || pkg.id === "free") throw new Error("Invalid package");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("deposit_balance,referred_by")
      .eq("id", userId)
      .single();
    if (!profile) throw new Error("Profile not found");

    const price = Number(pkg.price_coins);
    if (Number(profile.deposit_balance) < price) {
      throw new Error("Not enough coins in your Deposit Wallet. Please deposit first.");
    }

    const expires = new Date(Date.now() + (pkg.validity_days ?? 30) * 86400000).toISOString();
    await supabaseAdmin
      .from("profiles")
      .update({
        deposit_balance: Number(profile.deposit_balance) - price,
        package_id: pkg.id,
        package_expires_at: expires,
      })
      .eq("id", userId);
    await logTx(userId, "deposit", "package_purchase", -price, `Purchased ${pkg.name}`);

    if (profile.referred_by) {
      const settings = await getSettings();
      const pct = Number(settings["referral_level1_percent"] ?? 20);
      const bonus = Math.floor((price * pct) / 100);
      if (bonus > 0) {
        await addEarningCoins(
          profile.referred_by,
          bonus,
          "referral_package",
          `${pct}% commission on ${pkg.name}`,
        );
        await supabaseAdmin.from("referral_earnings").insert({
          referrer_id: profile.referred_by,
          from_user_id: userId,
          kind: "package",
          coins: bonus,
        });
      }
    }

    return { ok: true, expires };
  });

export const submitDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        amountPkr: z.number().int().positive(),
        method: z.enum(["jazzcash", "easypaisa", "usdt"]),
        tid: z.string().min(3).max(120),
        screenshotPath: z.string().max(400).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getSettings } = await import("./wallet.server");
    const settings = await getSettings();
    const coinsPerPkr = Number(settings["coins_per_pkr"] ?? 100);

    const { error } = await supabaseAdmin.from("deposits").insert({
      user_id: context.userId,
      amount_pkr: data.amountPkr,
      coins: Math.round(data.amountPkr * coinsPerPkr),
      method: data.method,
      tid: data.tid,
      screenshot_url: data.screenshotPath ?? null,
    });
    if (error) {
      console.error("Deposit submission failed", error);
      throw new Error("Server error, please try again");
    }
    return { ok: true };
  });

export const submitWithdraw = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        amountPkr: z.number().int().positive(),
        method: z.enum(["jazzcash", "easypaisa", "usdt_bep20", "usdt_trc20"]),
        accountTitle: z.string().min(2).max(120),
        accountNumber: z.string().min(4).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getSettings, logTx } = await import("./wallet.server");
    const userId = context.userId;

    const [{ data: profile }, { data: packages }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", userId).single(),
      supabaseAdmin.from("packages").select("*"),
    ]);
    if (!profile) throw new Error("Profile not found");

    const activeId = effectivePackageId(profile.package_id, profile.package_expires_at);
    const pkg = (packages ?? []).find((p) => p.id === activeId);
    if (!pkg) throw new Error("Package not found");

    const settings = await getSettings();
    const coinsPerPkr = Number(settings["coins_per_pkr"] ?? 100);
    const coins = Math.round(data.amountPkr * coinsPerPkr);

    if (!pkg.withdraw_options.includes(data.amountPkr)) {
      throw new Error("This withdraw amount is not available for your package.");
    }
    if (coins < Number(pkg.min_withdraw_coins)) {
      throw new Error("Amount is below the minimum withdrawal for your package.");
    }
    if (Number(profile.earning_balance) < coins) {
      throw new Error("Not enough coins in your Earning Wallet.");
    }

    await supabaseAdmin
      .from("profiles")
      .update({ earning_balance: Number(profile.earning_balance) - coins })
      .eq("id", userId);
    await logTx(userId, "earning", "withdraw_request", -coins, `Withdraw ${data.amountPkr} PKR`);

    const { error } = await supabaseAdmin.from("withdrawals").insert({
      user_id: userId,
      amount_pkr: data.amountPkr,
      coins,
      method: data.method,
      account_title: data.accountTitle,
      account_number: data.accountNumber,
    });
    if (error) {
      console.error("Withdrawal submission failed", error);
      throw new Error("Server error, please try again");
    }
    return { ok: true };
  });

export const submitTaskProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        taskId: z.string().uuid(),
        gameUserId: z.string().min(1).max(120),
        screenshotPath: z.string().max(400).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const [{ data: profile }, { data: packages }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", userId).single(),
      supabaseAdmin.from("packages").select("*"),
    ]);
    if (!profile) throw new Error("Profile not found");
    const activeId = effectivePackageId(profile.package_id, profile.package_expires_at);
    const pkg = (packages ?? []).find((p) => p.id === activeId);
    if (!pkg) throw new Error("Package not found");

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const { count } = await supabaseAdmin
      .from("task_submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since.toISOString());

    if ((count ?? 0) >= pkg.daily_tasks) {
      throw new Error(
        `Your ${pkg.name} allows ${pkg.daily_tasks} task(s) per day. Upgrade to unlock more.`,
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("task_submissions")
      .select("id")
      .eq("user_id", userId)
      .eq("task_id", data.taskId)
      .in("status", ["pending", "approved"])
      .maybeSingle();
    if (existing) throw new Error("You already submitted this task.");

    const { error } = await supabaseAdmin.from("task_submissions").insert({
      user_id: userId,
      task_id: data.taskId,
      game_user_id: data.gameUserId,
      screenshot_url: data.screenshotPath ?? null,
    });
    if (error) {
      console.error("Task proof submission failed", error);
      throw new Error("Server error, please try again");
    }
    return { ok: true };
  });

export const getHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const [tx, deposits, withdrawals, submissions] = await Promise.all([
      supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("deposits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("withdrawals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("task_submissions")
        .select("*, tasks(title)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);
    return {
      transactions: (tx.data ?? []).map((t) => ({ ...t, coins: Number(t.coins) })),
      deposits: deposits.data ?? [],
      withdrawals: withdrawals.data ?? [],
      submissions: submissions.data ?? [],
    };
  });

export const getTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: tasks }, { data: subs }] = await Promise.all([
      supabaseAdmin
        .from("tasks")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("task_submissions").select("task_id,status").eq("user_id", context.userId),
    ]);
    return {
      tasks: (tasks ?? []).map((t) => ({ ...t, reward_coins: Number(t.reward_coins) })),
      submissions: subs ?? [],
    };
  });

export const getReferralData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const [{ data: referred }, { data: earnings }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("username,created_at,package_id")
        .eq("referred_by", userId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("referral_earnings")
        .select("*")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    const list = (earnings ?? []).map((e) => ({ ...e, coins: Number(e.coins) }));
    return {
      referred: referred ?? [],
      earnings: list,
      totalCoins: list.reduce((sum, e) => sum + e.coins, 0),
    };
  });

export const getProofUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed } = await supabaseAdmin.storage
      .from("proofs")
      .createSignedUrl(data.path, 3600);
    return { url: signed?.signedUrl ?? null };
  });

/** Resolves a username to its login email so users can sign in with either. */
export const resolveLoginEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ username: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .ilike("username", data.username.trim())
      .maybeSingle();
    return { email: row?.email ?? null };
  });

export const checkEmailRegistered = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ email: z.string().email().max(255) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", data.email.trim().toLowerCase())
      .maybeSingle();
    return { registered: Boolean(row) };
  });
