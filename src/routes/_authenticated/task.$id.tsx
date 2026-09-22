import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe } from "@/hooks/useMe";
import { useRefreshMe } from "@/hooks/useMe";
import { getTasks, submitTaskProof } from "@/lib/app.functions";
import { uploadProof } from "@/lib/upload";
import { fmtCoins, fmtPkr } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/task/$id")({
  head: () => ({
    meta: [
      { title: "Task details — PixEarn" },
      { name: "description", content: "Follow the steps and submit your proof to earn coins." },
      { property: "og:title", content: "Task details — PixEarn" },
      {
        property: "og:description",
        content: "Follow the steps and submit your proof to earn coins.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TaskDetailPage,
});

function TaskDetailPage() {
  const { id } = Route.useParams();
  const { data: me } = useMe();
  const refresh = useRefreshMe();
  const fetchTasks = useServerFn(getTasks);
  const submit = useServerFn(submitTaskProof);
  const { data } = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });

  const [gameUserId, setGameUserId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const task = data?.tasks.find((t) => t.id === id);
  const submission = data?.submissions.find((s) => s.task_id === id);
  const coinsPerPkr = Number(me?.settings?.["coins_per_pkr"] ?? 100);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const path = file ? await uploadProof(file) : undefined;
      await submit({ data: { taskId: id, gameUserId, ...(path ? { screenshotPath: path } : {}) } });
      toast.success("Proof submitted. Waiting for admin approval.");
      refresh();
      setGameUserId("");
      setFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit proof");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Task">
      <Link to="/tasks" className="mb-3 inline-flex items-center gap-1 text-sm text-primary">
        <ArrowLeft className="size-4" /> All tasks
      </Link>

      {!task ? (
        <p className="text-sm text-muted-foreground">Task not found or no longer active.</p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-border bg-white">
            {task.image_url && (
              <img src={task.image_url} alt={task.title} className="h-44 w-full object-cover" />
            )}
            <div className="space-y-2 p-5">
              <h1 className="text-xl font-bold">{task.title}</h1>
              <p className="text-sm font-semibold text-primary">
                Reward: {fmtCoins(task.reward_coins)} Coins (
                {fmtPkr(task.reward_coins, coinsPerPkr)})
              </p>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {task.description}
              </p>
              {task.play_store_link && (
                <Button asChild variant="outline" className="rounded-xl">
                  <a href={task.play_store_link} target="_blank" rel="noreferrer">
                    Open on Play Store <ExternalLink className="ml-1 size-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {submission ? (
            <div className="rounded-3xl border border-border bg-white p-5 text-sm">
              Your submission is <b className="capitalize">{submission.status}</b>.
              {submission.status === "pending" && " Admin will review it shortly."}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-border bg-white p-5">
              <h2 className="font-bold">Submit proof</h2>
              <div className="space-y-1.5">
                <Label htmlFor="gameUserId">Your game / app user ID</Label>
                <Input
                  id="gameUserId"
                  value={gameUserId}
                  onChange={(e) => setGameUserId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proof">Screenshot proof</Label>
                <Input
                  id="proof"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  required
                />
              </div>
              <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
                {busy ? "Submitting…" : "Submit proof"}
              </Button>
            </form>
          )}
        </div>
      )}
    </AppShell>
  );
}
