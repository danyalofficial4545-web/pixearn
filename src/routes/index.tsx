import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, ShieldCheck, Smartphone, Users, Wallet } from "lucide-react";
import { PixEarnLogo } from "@/components/PixEarnLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PixEarn — Earn coins from simple daily tasks" },
      {
        name: "description",
        content:
          "PixEarn pays you coins for completing offers and app tasks. Two-wallet system, instant offerwall rewards, JazzCash, Easypaisa and USDT withdrawals.",
      },
      { property: "og:title", content: "PixEarn — Earn coins from simple daily tasks" },
      {
        property: "og:description",
        content: "Complete tasks, earn coins, withdraw to JazzCash, Easypaisa or USDT.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const PACKAGES = [
  {
    name: "FREE Package",
    price: "0 PKR",
    tasks: "1 task / day",
    earning: "300 Coins (3 PKR) daily",
    validity: "Lifetime",
    minWithdraw: "500 PKR",
    featured: false,
  },
  {
    name: "Package 200",
    price: "200 PKR",
    tasks: "2 tasks / day",
    earning: "2,500 Coins (25 PKR) daily",
    validity: "30 Days",
    minWithdraw: "300 PKR",
    featured: true,
  },
  {
    name: "Package 500",
    price: "500 PKR",
    tasks: "5 tasks / day",
    earning: "7,000 Coins (70 PKR) daily",
    validity: "30 Days",
    minWithdraw: "600 PKR",
    featured: false,
  },
];

const FEATURES = [
  {
    icon: Wallet,
    title: "Two separate wallets",
    text: "Deposits buy packages. Earnings withdraw.",
  },
  { icon: Coins, title: "Instant offerwall coins", text: "Timewall offers credit automatically." },
  { icon: Users, title: "20% + 5% referrals", text: "Earn on packages and daily task income." },
  { icon: ShieldCheck, title: "Manual proof review", text: "Every app task verified by our team." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <PixEarnLogo size={44} animated showRing={false} />
          <span className="text-lg font-extrabold brand-text">PixEarn</span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" className="rounded-xl">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link to="/register">Register</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl place-items-center gap-6 px-4 pt-6 pb-14 text-center">
        <PixEarnLogo size={168} animated />
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Earn real coins from <span className="brand-text">simple daily tasks</span>
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Complete offers and app tasks, collect coins, and withdraw straight to JazzCash, Easypaisa
          or USDT. 100 Coins = 1 PKR.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg" className="h-12 rounded-2xl px-7">
            <Link to="/register">Start earning free</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-2xl px-7">
            <Link to="/login">I have an account</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-3 px-4 pb-14 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-3xl border border-border bg-white p-5">
            <f.icon className="mb-3 size-6 text-primary" />
            <p className="font-semibold">{f.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <h2 className="mb-6 text-center text-2xl font-bold">Choose your package</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PACKAGES.map((p) => (
            <div
              key={p.name}
              className={
                p.featured
                  ? "rounded-3xl brand-gradient p-6 text-white shadow-xl shadow-indigo-500/25"
                  : "rounded-3xl border border-border bg-white p-6"
              }
            >
              <p className="text-sm font-semibold opacity-80">{p.name}</p>
              <p className="mt-1 text-3xl font-extrabold">{p.price}</p>
              <ul className={`mt-4 space-y-2 text-sm ${p.featured ? "" : "text-muted-foreground"}`}>
                <li>{p.tasks}</li>
                <li>{p.earning}</li>
                <li>Validity: {p.validity}</li>
                <li>Min withdraw: {p.minWithdraw}</li>
              </ul>
              <Button
                asChild
                className="mt-6 w-full rounded-xl"
                variant={p.featured ? "secondary" : "default"}
              >
                <Link to="/register">Get started</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <Smartphone className="mx-auto mb-2 size-5" />
        PixEarn · Earn coins anywhere, anytime
      </footer>
    </div>
  );
}
