import { Link } from "@tanstack/react-router";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostMenu } from "./PostMenu";
import { StarRating } from "./StarRating";
import { usePostActions } from "./usePostActions";
import { useSignedUrl } from "@/lib/media";
import { sharePost } from "@/lib/share";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/lib/famous.server";

export function PostCard({
  post,
  onOpenComments,
}: {
  post: FeedPost;
  onOpenComments: (postId: string) => void;
}) {
  const mediaUrl = useSignedUrl("media", post.mediaUrl);
  const avatarUrl = useSignedUrl("avatars", post.author.avatarUrl);
  const actions = usePostActions();

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-neon-soft">
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to="/profile/$userId" params={{ userId: post.author.id }} className="ring-brand rounded-full">
          <Avatar className="size-9 border-2 border-card">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={post.author.username} /> : null}
            <AvatarFallback className="bg-surface-2 text-xs">
              {post.author.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to="/profile/$userId"
            params={{ userId: post.author.id }}
            className="block truncate text-sm font-semibold"
          >
            {post.author.displayName || post.author.username}
          </Link>
          <p className="truncate text-xs text-muted-foreground">@{post.author.username}</p>
        </div>
        <PostMenu
          onInterested={() => actions.onInterest(post.id, "interested")}
          onNotInterested={() => actions.onInterest(post.id, "not_interested")}
          onReport={() => actions.onReport(post.id)}
          onDownload={() => actions.onDownload(post)}
        />
      </div>

      <div className="relative aspect-square w-full bg-surface-2">
        {mediaUrl ? (
          post.mediaType === "video" ? (
            <video
              src={mediaUrl}
              controls
              playsInline
              className="size-full object-cover"
              preload="metadata"
            />
          ) : (
            <img
              src={mediaUrl}
              alt={post.caption ?? `Post by @${post.author.username}`}
              loading="lazy"
              className="size-full object-cover"
            />
          )
        ) : null}
      </div>

      <div className="flex items-center gap-1 px-3 py-2">
        <button
          type="button"
          aria-label={post.liked ? "Unlike" : "Like"}
          onClick={() => actions.onLike(post.id)}
          className="rounded-full p-2 transition-transform active:scale-90"
        >
          <Heart
            className={cn(
              "size-6 transition-colors",
              post.liked ? "fill-like text-like drop-shadow-[0_0_10px_rgb(255_59_92/0.7)]" : "text-foreground",
            )}
          />
        </button>
        <button
          type="button"
          aria-label="Comments"
          onClick={() => onOpenComments(post.id)}
          className="rounded-full p-2"
        >
          <MessageCircle className="size-6" />
        </button>
        <button
          type="button"
          aria-label="Share"
          onClick={() => sharePost(post.id, post.caption)}
          className="rounded-full p-2"
        >
          <Send className="size-6" />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <StarRating value={post.myRating} onRate={(stars) => actions.onRate(post.id, stars)} size="sm" />
          <button
            type="button"
            aria-label={post.saved ? "Remove from saved" : "Save"}
            onClick={() => actions.onSave(post.id)}
            className="rounded-full p-2"
          >
            <Bookmark className={cn("size-6", post.saved ? "fill-primary text-primary" : "text-foreground")} />
          </button>
        </div>
      </div>

      <div className="space-y-1 px-4 pb-4">
        <p className="text-sm font-semibold">
          {post.likeCount} like{post.likeCount === 1 ? "" : "s"}
          {post.ratingCount > 0 ? (
            <span className="ml-2 font-normal text-muted-foreground">
              ★ {post.avgRating.toFixed(1)} ({post.ratingCount})
            </span>
          ) : null}
        </p>
        {post.caption ? (
          <p className="text-sm break-words">
            <span className="font-semibold">@{post.author.username}</span>{" "}
            <span className="text-muted-foreground">{post.caption}</span>
          </p>
        ) : null}
        {post.commentCount > 0 ? (
          <button
            type="button"
            onClick={() => onOpenComments(post.id)}
            className="text-xs text-muted-foreground"
          >
            View all {post.commentCount} comments
          </button>
        ) : null}
      </div>
    </article>
  );
}
