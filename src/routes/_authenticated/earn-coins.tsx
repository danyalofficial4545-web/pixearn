import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useMe } from "@/hooks/useMe";

export const Route = createFileRoute("/_authenticated/earn-coins")({
  head: () => ({
    meta: [
      { title: "Earn coins — PixEarn offerwall" },
      { name: "description", content: "Complete offers and get coins credited automatically." },
      { property: "og:title", content: "Earn coins — PixEarn offerwall" },
      {
        property: "og:description",
        content: "Complete offers and get coins credited automatically.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EarnCoinsPage,
});

function EarnCoinsPage() {
  const { data } = useMe();
  const wallId = data?.settings?.["timewall_wall_id"];
  const percent = Number(data?.settings?.["timewall_percent"] ?? 10);
  const userId = data?.profile?.id;
  const ready = wallId && wallId !== "YOUR_WALL_ID" && userId;

  return (
    <AppShell title="Offerwall">
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted-foreground">
          Complete offers below. Coins are credited to your Earning Wallet automatically — you get{" "}
          <b className="text-foreground">{percent}%</b> of the offer value. No screenshot needed.
        </div>

        {ready ? (
          <div className="overflow-hidden rounded-3xl border border-border bg-white">
            <iframe
              title="Timewall offerwall"
              src={`https://timewall.io/wall/${wallId}?uid=${userId}`}
              className="h-[75vh] w-full"
              allow="clipboard-write"
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-white p-6 text-center text-sm text-muted-foreground">
            The offerwall is not configured yet. An admin needs to add the offerwall ID in the admin
            panel settings.
          </div>
        )}
      </div>
    </AppShell>
  );
}
