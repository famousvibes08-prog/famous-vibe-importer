import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { BottomNav } from "@/components/famous/BottomNav";
import { CommentsSheet } from "@/components/famous/CommentsSheet";
import { VibeCard } from "@/components/famous/VibeCard";
import { getVibes } from "@/lib/famous.functions";

export const Route = createFileRoute("/_authenticated/vibes")({
  head: () => ({
    meta: [
      { title: "Vibes — Short videos on FamousVibe" },
      {
        name: "description",
        content: "Swipe through short vibe videos, rate them and follow the creators behind them.",
      },
      { property: "og:title", content: "Vibes on FamousVibe" },
      { property: "og:description", content: "Full-screen short videos from the FamousVibe community." },
    ],
  }),
  component: VibesPage,
});

function VibesPage() {
  const fetchVibes = useServerFn(getVibes);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["vibes"],
    queryFn: () => fetchVibes(),
  });

  return (
    <div className="bg-background">
      <h1 className="sr-only">Vibes</h1>
      <div className="no-scrollbar h-[100dvh] snap-y snap-mandatory overflow-y-scroll">
        {isLoading ? (
          <div className="grid h-[100dvh] place-items-center text-sm text-muted-foreground">
            Loading vibes…
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="grid h-[100dvh] place-items-center px-8 text-center">
            <div>
              <p className="font-script text-brand text-4xl">No vibes yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload a short video from Create and mark it as a Vibe.
              </p>
            </div>
          </div>
        ) : (
          data!.map((post) => (
            <VibeCard key={post.id} post={post} onOpenComments={setCommentsFor} />
          ))
        )}
      </div>

      <CommentsSheet
        postId={commentsFor}
        open={Boolean(commentsFor)}
        onOpenChange={(open) => !open && setCommentsFor(null)}
      />
      <BottomNav />
    </div>
  );
}
