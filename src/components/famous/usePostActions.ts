import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  reportPost,
  setInterest,
  ratePost,
  toggleLike,
  toggleSave,
} from "@/lib/famous.functions";
import { getSignedUrl } from "@/lib/media";
import { downloadWatermarked } from "@/lib/watermark";
import type { FeedPost } from "@/lib/famous.server";

export function usePostActions() {
  const queryClient = useQueryClient();
  const like = useServerFn(toggleLike);
  const save = useServerFn(toggleSave);
  const rate = useServerFn(ratePost);
  const interest = useServerFn(setInterest);
  const report = useServerFn(reportPost);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["feed"] });
    queryClient.invalidateQueries({ queryKey: ["vibes"] });
    queryClient.invalidateQueries({ queryKey: ["user-posts"] });
    queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
  };

  const guard = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return {
    onLike: (postId: string) => guard(() => like({ data: { postId } })),
    onSave: (postId: string) => guard(() => save({ data: { postId } })),
    onRate: (postId: string, stars: number) =>
      guard(async () => {
        await rate({ data: { postId, stars } });
        toast.success(`Rated ${stars} star${stars > 1 ? "s" : ""}`);
      }),
    onInterest: (postId: string, state: "interested" | "not_interested") =>
      guard(async () => {
        await interest({ data: { postId, state } });
        toast.success(state === "interested" ? "We'll show you more like this" : "Got it — less of this");
      }),
    onReport: (postId: string) =>
      guard(async () => {
        await report({ data: { postId, reason: "Reported from feed" } });
        toast.success("Thanks — our team will review this post");
      }),
    onDownload: async (post: FeedPost) => {
      const url = await getSignedUrl("media", post.mediaUrl);
      if (!url) {
        toast.error("Media unavailable");
        return;
      }
      toast.message("Preparing your watermarked download…");
      await downloadWatermarked(url, post.mediaType, post.author.username);
    },
  };
}
