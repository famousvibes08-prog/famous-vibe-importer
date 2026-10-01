import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Bell, Search } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { BottomNav } from "@/components/famous/BottomNav";
import { CommentsSheet } from "@/components/famous/CommentsSheet";
import { VibeCard } from "@/components/famous/VibeCard";
import { getFeed } from "@/lib/famous.functions";

export const Route = createFileRoute("/")({
  validateSearch: z.object({ post: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "FamousVibe — Reels feed" },
      {
        name: "description",
        content: "Swipe full-screen vertical vibes, double-tap to like, rate and follow creators.",
      },
      { property: "og:title", content: "FamousVibe — Reels feed" },
      { property: "og:description", content: "Full-screen short videos from the FamousVibe community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const fetchFeed = useServerFn(getFeed);
  const { post: targetId } = Route.useSearch();
  const [commentsFor, setCommentsFor] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({ queryKey: ["feed"], queryFn: () => fetchFeed() });

  const posts = useMemo(() => {
    if (!data || !targetId) return data ?? [];
    const target = data.find((p) => p.id === targetId);
    return target ? [target, ...data.filter((p) => p.id !== targetId)] : data;
  }, [data, targetId]);

  useEffect(() => {
    if (targetId) document.getElementById(`reel-${targetId}`)?.scrollIntoView();
  }, [targetId, posts.length]);

  return (
    <div className="bg-background">
      <h1 className="sr-only">FamousVibe reels</h1>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between px-4">
          <span className="font-script text-brand text-3xl leading-none drop-shadow-[0_0_12px_var(--color-primary)]">
            FamousVibe
          </span>
          <div className="pointer-events-auto flex items-center gap-1">
            <Link to="/vibes" aria-label="Search" className="rounded-full p-2">
              <Search className="size-6" />
            </Link>
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => toast.message("No new notifications")}
              className="rounded-full p-2"
            >
              <Bell className="size-6" />
            </button>
          </div>
        </div>
      </header>

      <div className="no-scrollbar h-[100dvh] snap-y snap-mandatory overflow-y-scroll">
        {isLoading ? (
          <div className="grid h-[100dvh] place-items-center text-sm text-muted-foreground">Loading vibes…</div>
        ) : error ? (
          <div className="grid h-[100dvh] place-items-center text-sm text-destructive">
            {(error as Error).message || "Could not load the feed"}
          </div>
        ) : posts.length === 0 ? (
          <div className="grid h-[100dvh] place-items-center px-8 text-center">
            <div>
              <p className="font-script text-brand text-4xl">Nothing here yet</p>
              <p className="mt-2 text-sm text-muted-foreground">Tap + to post the first vibe.</p>
            </div>
          </div>
        ) : (
          posts.map((post) => <VibeCard key={post.id} post={post} onOpenComments={setCommentsFor} />)
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
