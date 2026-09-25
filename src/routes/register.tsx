import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  checkEmailRegistered,
  checkUsernameTaken,
  completeRegistration,
} from "@/lib/app.functions";
import { PixEarnLogo } from "@/components/PixEarnLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Search = { ref?: string };

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(typeof search["ref"] === "string" ? { ref: search["ref"] } : {}),
  }),
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Create your PixEarn account" },
      { name: "description", content: "Register on PixEarn and start earning coins today." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { ref } = Route.useSearch();
  const [showForm, setShowForm] = useState(true);
  const [form, setForm] = useState({ email: "", username: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (ref) window.localStorage.setItem("pixearn_referral_code", ref.trim().toLowerCase());
  }, [ref]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    const email = form.email.trim().toLowerCase();
    const username = form.username.trim().toLowerCase();
    if (!/^[a-z0-9._%+-]+@gmail\.com$/i.test(email)) {
      setErrorMessage("Aap ka Gmail galat hai");
      toast.error("Aap ka Gmail galat hai");
      return;
    }
    if (
      form.password.length < 6 ||
      !/[a-zA-Z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      setErrorMessage("Password me ABC aur 123 dono hone chahiye");
      toast.error("Password me ABC aur 123 dono hone chahiye");
      return;
    }
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9_]{3,30}$/.test(username)) {
      setErrorMessage("Username me ABC aur 123 dono zaroori hai - jaise danyal955");
      toast.error("Username me ABC aur 123 dono zaroori hai - jaise danyal955");
      return;
    }
    if (form.password !== form.confirm) {
      setErrorMessage("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const registered = await checkEmailRegistered({ data: { email } });
      if (registered.unavailable)
        throw new Error("Server se rabta nahi ho saka, thori dair baad try karein");
      if (registered.registered) throw new Error("Ye Gmail pehle se registered hai, Login karein");
      const usernameResult = await checkUsernameTaken({ data: { username } });
      if (usernameResult.unavailable)
        throw new Error("Server se rabta nahi ho saka, thori dair baad try karein");
      if (usernameResult.taken) throw new Error("Username already taken, try danyal955_1234");
      const savedRef = window.localStorage.getItem("pixearn_referral_code") ?? ref;
      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username,
            referral_code: username,
            ...(savedRef ? { ref: savedRef } : {}),
          },
        },
      });
      if (error) throw error;

      if (!data.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: form.password,
        });
        if (signInError) throw signInError;
        if (!signInData.session)
          throw new Error("Account created, but login could not be completed.");
      }
      await completeRegistration({
        data: { referralUsername: savedRef?.trim().toLowerCase() || undefined },
      });
      window.localStorage.removeItem("pixearn_referral_code");
      toast.success("Account Created Successfully");
      setSuccessMessage("Account created, redirecting...");
      window.setTimeout(() => window.location.assign("/dashboard"), 350);
    } catch (err) {
      console.error("PixEarn registration failed", err);
      const message = err instanceof Error ? err.message : "";
      const friendlyMessage = message.toLowerCase().includes("missing supabase")
        ? "Server se rabta nahi ho saka, thori dair baad try karein"
        : message.toLowerCase().includes("already") || message.toLowerCase().includes("registered")
          ? "Ye Gmail pehle se registered hai, Login karein"
          : message || "Server error, please try again";
      setErrorMessage(friendlyMessage);
      toast.error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(120%_80%_at_50%_0%,#eef0ff_0%,#ffffff_60%)] px-4 py-10">
      <div className="w-full max-w-sm">
        {!showForm ? (
          <div className="grid gap-6 text-center">
            <PixEarnLogo size={148} animated />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Join PixEarn &amp; Start Earning
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                You have been invited to PixEarn.
              </p>
            </div>
            <div className="grid gap-3">
              <Button asChild className="h-11 rounded-xl">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button
                className="h-11 rounded-xl"
                variant="outline"
                onClick={() => setShowForm(true)}
              >
                Sign up
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 grid place-items-center gap-3">
              <PixEarnLogo size={120} animated />
              <p className="text-sm text-muted-foreground">Create your free account</p>
              {ref && (
                <p className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                  Invited by {ref.trim().toLowerCase()}
                </p>
              )}
            </div>
            <form
              onSubmit={onSubmit}
              className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-xl shadow-indigo-500/5"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
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
                  placeholder="danyal955"
                  minLength={3}
                  maxLength={30}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
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
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => set("confirm", e.target.value)}
                  required
                />
              </div>
              {errorMessage && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                >
                  {errorMessage}
                </p>
              )}
              {successMessage && (
                <p
                  role="status"
                  className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"
                >
                  {successMessage}
                </p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Register"
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Login
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
