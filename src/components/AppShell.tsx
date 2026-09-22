import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Coins,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PlayCircle,
  Users,
  Wallet,
  User as UserIcon,
  Shield,
} from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PixEarnLogo } from "@/components/PixEarnLogo";
import { useMe } from "@/hooks/useMe";
import { fmtCoins, fmtPkr, fmtUsd } from "@/lib/money";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/earn-coins", label: "Offers", icon: PlayCircle },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { data } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const profile = data?.profile;
  const coinsPerPkr = Number(data?.settings?.["coins_per_pkr"] ?? 100);
  const usdPkr = Number(data?.settings?.["usd_pkr"] ?? 280);
  const earning = profile?.earning_balance ?? 0;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7ff_0%,#ffffff_45%)] pb-24">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/dashboard" className="shrink-0">
            <PixEarnLogo size={42} animated showRing={false} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {profile ? `@${profile.username}` : "Loading…"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {title ?? "Earning made simple"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white px-3 py-1.5 text-right">
            <p className="flex items-center justify-end gap-1 text-sm font-bold">
              <Coins className="size-3.5 text-amber-500" />
              {fmtCoins(earning)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {fmtPkr(earning, coinsPerPkr)} · {fmtUsd(earning, coinsPerPkr, usdPkr)}
            </p>
          </div>
          {data?.isAdmin && (
            <Link
              to="/admin"
              className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground"
              aria-label="Admin panel"
            >
              <Shield className="size-4" />
            </Link>
          )}
          <button
            onClick={signOut}
            className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-stretch justify-between px-2 py-1.5">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] text-muted-foreground transition-colors"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("size-5", isActive && "text-primary")} />
                  {item.label}
                </>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function ReferralBanner({ code }: { code?: string }) {
  return (
    <Link
      to="/referral"
      className="flex items-center gap-3 rounded-3xl brand-gradient px-4 py-4 text-white shadow-lg shadow-indigo-500/20"
    >
      <Users className="size-8 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-bold">Invite friends, earn 20% + 5%</p>
        <p className="truncate text-xs text-white/85">
          Your code: {code ?? "—"} · Tap to share your link
        </p>
      </div>
    </Link>
  );
}
