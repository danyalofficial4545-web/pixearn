import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Lock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { getTasks } from "@/lib/app.functions";
import { fmtCoins, fmtPkr } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — PixEarn" },
      { name: "description", content: "Complete app tasks and submit proof to earn coins." },
      { property: "og:title", content: "Tasks — PixEarn" },
      { property: "og:description", content: "Complete app tasks and submit proof to earn coins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { data: me } = useMe();
  const fetchTasks = useServerFn(getTasks);
  const { data } = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });

  const coinsPerPkr = Number(me?.settings?.["coins_per_pkr"] ?? 100);
  const limit = me?.activePackage?.daily_tasks ?? 1;
  const statusByTask = new Map((data?.submissions ?? []).map((s) => [s.task_id, s.status]));

  return (
    <AppShell title="Tasks">
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm">
          Your <b>{me?.activePackage?.name ?? "package"}</b> unlocks{" "}
          <b>{limit} task{limit > 1 ? "s" : ""}</b> per day.
        </div>

        {(data?.tasks ?? []).map((task, index) => {
          const locked = index >= limit;
          const status = statusByTask.get(task.id);
          return (
            <div
              key={task.id}
              className="relative overflow-hidden rounded-3xl border border-border bg-white"
            >
              <div className={cn("flex gap-3 p-4", locked && "pointer-events-none blur-[3px]")}>
                {task.image_url && (
                  <img
                    src={task.image_url}
                    alt={task.title}
                    className="size-20 shrink-0 rounded-2xl object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{task.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
                  <p className="mt-1 text-sm font-bold text-primary">
                    +{fmtCoins(task.reward_coins)} Coins ({fmtPkr(task.reward_coins, coinsPerPkr)})
                  </p>
                </div>
                <div className="self-center">
                  {status ? (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize">
                      {status}
                    </span>
                  ) : (
                    <Button asChild size="sm" className="rounded-xl">
                      <Link to="/task/$id" params={{ id: task.id }}>
                        Start
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {locked && (
                <div className="absolute inset-0 grid place-items-center bg-white/55 px-6 text-center">
                  <div>
                    <Lock className="mx-auto mb-1 size-5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground">
                      Please deposit &amp; buy a package to unlock tasks
                    </p>
                    <Button asChild size="sm" className="mt-2 rounded-xl">
                      <Link to="/packages">Buy package</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
