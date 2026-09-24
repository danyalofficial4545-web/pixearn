import { createFileRoute } from "@tanstack/react-router";

async function handle(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? url.searchParams.get("uid");
  const rawCoins = Number(url.searchParams.get("coins") ?? url.searchParams.get("amount") ?? "0");
  const secret = url.searchParams.get("secret");
  const transactionId =
    url.searchParams.get("transactionId") ?? url.searchParams.get("transaction_id");

  if (!userId || !secret || !transactionId || !Number.isFinite(rawCoins) || rawCoins <= 0) {
    return new Response("ERROR: bad request", { status: 400 });
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: secretRow } = await supabaseAdmin
    .from("admin_settings")
    .select("value")
    .eq("key", "timewall_secret")
    .maybeSingle();

  if (!secretRow || secret !== secretRow.value) {
    return new Response("ERROR: invalid secret", { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return new Response("ERROR: unknown user", { status: 404 });

  const { data: duplicate } = await supabaseAdmin
    .from("timewall_postbacks")
    .select("transaction_id")
    .eq("transaction_id", transactionId)
    .maybeSingle();
  if (duplicate) return new Response("OK");

  const { data: pctRow } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("key", "timewall_user_percent")
    .maybeSingle();
  const pct = Number(pctRow?.value ?? 10);
  const userCoins = Math.floor((rawCoins * pct) / 100);
  if (userCoins <= 0) {
    await supabaseAdmin.from("timewall_postbacks").insert({
      transaction_id: transactionId,
      user_id: userId,
      raw_coins: rawCoins,
      credited_coins: 0,
    });
    return new Response("OK");
  }

  const { addEarningCoins, bumpDaily } = await import("@/lib/wallet.server");
  await addEarningCoins(
    userId,
    userCoins,
    "timewall",
    `Timewall offer (${pct}% of ${rawCoins} coins)`,
    { payReferral: true },
  );
  await bumpDaily(userId, userCoins, 0);
  const { error: recordError } = await supabaseAdmin.from("timewall_postbacks").insert({
    transaction_id: transactionId,
    user_id: userId,
    raw_coins: rawCoins,
    credited_coins: userCoins,
  });
  if (recordError) console.error("Timewall postback record failed", recordError);

  return new Response("OK");
}

export const Route = createFileRoute("/api/public/postback")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
