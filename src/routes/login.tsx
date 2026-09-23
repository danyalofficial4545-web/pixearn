import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { resolveLoginEmail } from "@/lib/app.functions";
import { PixEarnLogo } from "@/components/PixEarnLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Login — PixEarn" },
      { name: "description", content: "Sign in to PixEarn with your username or email." },
      { property: "og:title", content: "Login — PixEarn" },
      { property: "og:description", content: "Sign in to PixEarn with your username or email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      let email = identifier.trim();
      if (!email.includes("@")) {
        const res = await resolveLoginEmail({ data: { username: email } });
        if (!res.email) throw new Error("No account found with that username.");
        email = res.email;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session || !data.user) throw new Error("Login session could not be created.");
      toast.success("Welcome back!");
      window.location.assign("/dashboard");
    } catch (err) {
      console.error("PixEarn login failed", err);
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(120%_80%_at_50%_0%,#eef0ff_0%,#ffffff_60%)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 grid place-items-center gap-3">
          <PixEarnLogo size={120} animated />
          <p className="text-sm text-muted-foreground">Sign in to keep earning</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-xl shadow-indigo-500/5"
        >
          <div className="space-y-1.5">
            <Label htmlFor="identifier">Username or Email</Label>
            <Input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="pixuser or you@gmail.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Logging in…
              </>
            ) : (
              "Login"
            )}
          </Button>
          <div className="flex items-center justify-between text-xs">
            <Link to="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
            <Link to="/register" className="text-muted-foreground hover:underline">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
