import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { AppShell } from "@/components/famous/AppShell";
import { CommentsSheet } from "@/components/famous/CommentsSheet";
import { PostCard } from "@/components/famous/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeed } from "@/lib/famous.functions";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "FamousVibe — Your feed" },
      {
        name: "description",
        content: "A ranked feed of photos and vibe videos from the creators you follow.",
      },
      { property: "og:title", content: "FamousVibe — Your feed" },
      { property: "og:description", content: "Photos, vibes and ratings from your community." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const fetchFeed = useServerFn(getFeed);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["feed"],
    queryFn: () => fetchFeed(),
  });

  return (
    <AppShell>
      <h1 className="sr-only">FamousVibe feed</h1>
      {isLoading ? (
        <div className="space-y-6">
          {[0, 1].map((key) => (
            <Skeleton key={key} className="h-[26rem] w-full rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <p className="py-16 text-center text-sm text-destructive">
          {(error as Error).message || "Could not load your feed"}
        </p>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="py-20 text-center">
          <p className="font-script text-brand text-4xl">Nothing here yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Post your first vibe or follow creators to fill your feed.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {data!.map((post) => (
            <PostCard key={post.id} post={post} onOpenComments={setCommentsFor} />
          ))}
        </div>
      )}

      <CommentsSheet
        postId={commentsFor}
        open={Boolean(commentsFor)}
        onOpenChange={(open) => !open && setCommentsFor(null)}
      />
    </AppShell>
  );
}
