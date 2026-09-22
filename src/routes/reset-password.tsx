import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PixEarnLogo } from "@/components/PixEarnLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — PixEarn" },
      { name: "description", content: "Choose a new password for your PixEarn account." },
      { property: "og:title", content: "Set a new password — PixEarn" },
      { property: "og:description", content: "Choose a new password for your PixEarn account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    void navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(120%_80%_at_50%_0%,#eef0ff_0%,#ffffff_60%)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 grid place-items-center">
          <PixEarnLogo size={110} animated />
        </div>
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-xl shadow-indigo-500/5"
        >
          <h1 className="text-lg font-bold">Set new password</h1>
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="h-11 w-full rounded-xl">
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
