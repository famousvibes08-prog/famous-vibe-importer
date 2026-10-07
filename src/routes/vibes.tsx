import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useEffect, useMemo } from "react";
import { z } from "zod";

import { BottomNav } from "@/components/famous/BottomNav";
import { CommentsSheet } from "@/components/famous/CommentsSheet";
import { VibeCard } from "@/components/famous/VibeCard";
import { getFeed, getVibes } from "@/lib/famous.functions";

export const Route = createFileRoute("/vibes")({
  validateSearch: z.object({ post: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Vibes — Short videos on FamousVibe" },
      {
        name: "description",
        content: "Swipe through short vibe videos, rate them and follow the creators behind them.",
      },
      { property: "og:title", content: "Vibes on FamousVibe" },
      { property: "og:description", content: "Full-screen short videos from the FamousVibe community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VibesPage,
});

function VibesPage() {
  const fetchVibes = useServerFn(getVibes);
  const fetchFeed = useServerFn(getFeed);
  const { post: targetId } = Route.useSearch();
  const [commentsFor, setCommentsFor] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["vibes"],
    queryFn: () => fetchVibes(),
  });
  const { data: feedPosts } = useQuery({ queryKey: ["feed"], queryFn: () => fetchFeed(), enabled: Boolean(targetId) });
  const posts = useMemo(() => {
    if (!data || !targetId) return data ?? [];
    const target = data.find((item) => item.id === targetId) ?? feedPosts?.find((item) => item.id === targetId && item.mediaType === "video");
    return target ? [target, ...data.filter((item) => item.id !== targetId)] : data;
  }, [data, targetId, feedPosts]);
  useEffect(() => { if (targetId) document.getElementById(`reel-${targetId}`)?.scrollIntoView(); }, [targetId, posts.length]);

  return (
    <div className="bg-background">
      <h1 className="sr-only">Vibes</h1>
      <div className="no-scrollbar h-[calc(100dvh-5rem-env(safe-area-inset-bottom,0px))] snap-y snap-mandatory overflow-y-scroll" onScroll={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.querySelectorAll<HTMLVideoElement>("video[data-reel]").forEach((video) => {
          const rect = video.getBoundingClientRect();
          const visible = Math.max(0, Math.min(rect.bottom, bounds.bottom) - Math.max(rect.top, bounds.top));
          if (visible / rect.height < 0.51) video.pause();
        });
      }}>
        {isLoading ? (
          <div className="grid h-[100dvh] place-items-center text-sm text-muted-foreground">
            Loading vibes…
          </div>
        ) : error ? <div className="grid h-full place-items-center text-destructive">Could not load reels. Please try again.</div> : posts.length === 0 ? (
          <div className="grid h-[100dvh] place-items-center px-8 text-center">
            <div>
              <p className="font-script text-brand text-4xl">No vibes yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload a short video from Create and mark it as a Vibe.
              </p>
            </div>
          </div>
        ) : (
          posts.map((post) => (
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
