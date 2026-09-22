import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PixEarnLogo } from "@/components/PixEarnLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Search = { ref?: string };

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(typeof search["ref"] === "string" ? { ref: search["ref"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Create your PixEarn account" },
      { name: "description", content: "Register on PixEarn and start earning coins today." },
      { property: "og:title", content: "Create your PixEarn account" },
      { property: "og:description", content: "Register on PixEarn and start earning coins today." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { ref } = Route.useSearch();
  const [form, setForm] = useState({ email: "", username: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username: form.username.trim().toLowerCase(),
            ...(ref ? { ref } : {}),
          },
        },
      });
      if (error) throw new Error(error.message);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (signInError) {
        toast.success("Account created. Please confirm your email, then sign in.");
        void navigate({ to: "/login" });
        return;
      }
      toast.success("Welcome to PixEarn!");
      void navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(120%_80%_at_50%_0%,#eef0ff_0%,#ffffff_60%)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 grid place-items-center gap-3">
          <PixEarnLogo size={120} animated />
          <p className="text-sm text-muted-foreground">Create your free account</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-xl shadow-indigo-500/5"
        >
          {ref && (
            <p className="rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
              Invited with referral code <b>{ref}</b>
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email (Gmail)</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@gmail.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="pixuser"
              minLength={3}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl">
            {loading ? "Creating…" : "Register"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
