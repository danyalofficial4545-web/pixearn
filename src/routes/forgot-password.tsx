import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PixEarnLogo } from "@/components/PixEarnLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your PixEarn password" },
      { name: "description", content: "Get a password reset link sent to your email." },
      { property: "og:title", content: "Reset your PixEarn password" },
      { property: "og:description", content: "Get a password reset link sent to your email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Reset link sent. Check your inbox.");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(120%_80%_at_50%_0%,#eef0ff_0%,#ffffff_60%)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 grid place-items-center gap-3">
          <PixEarnLogo size={110} animated />
        </div>
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-xl shadow-indigo-500/5"
        >
          <h1 className="text-lg font-bold">Forgot password</h1>
          {sent ? (
            <p className="text-sm text-muted-foreground">
              We emailed you a reset link. Open it to set a new password.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="email">Your email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="h-11 w-full rounded-xl">
                Send reset link
              </Button>
            </>
          )}
          <Link to="/login" className="block text-center text-xs text-primary hover:underline">
            Back to login
          </Link>
        </form>
      </div>
    </div>
  );
}
