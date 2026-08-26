import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Heart, MessageCircle, Send, Volume2, VolumeX } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostMenu } from "./PostMenu";
import { StarRating } from "./StarRating";
import { usePostActions } from "./usePostActions";
import { useSignedUrl } from "@/lib/media";
import { sharePost } from "@/lib/share";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/lib/famous.server";

export function VibeCard({
  post,
  onOpenComments,
}: {
  post: FeedPost;
  onOpenComments: (postId: string) => void;
}) {
  const mediaUrl = useSignedUrl("media", post.mediaUrl);
  const avatarUrl = useSignedUrl("avatars", post.author.avatarUrl);
  const actions = usePostActions();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        if (entry && entry.isIntersecting) void video.play().catch(() => undefined);
        else video.pause();
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [mediaUrl]);

  return (
    <div
      ref={containerRef}
      className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-black"
    >
      {mediaUrl ? (
        post.mediaType === "video" ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            loop
            muted={muted}
            playsInline
            className="size-full object-cover"
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              if (video.paused) void video.play().catch(() => undefined);
              else video.pause();
            }}
          />
        ) : (
          <img src={mediaUrl} alt={post.caption ?? "Vibe"} className="size-full object-cover" />
        )
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4">
        <button
          type="button"
          aria-label={post.liked ? "Unlike" : "Like"}
          onClick={() => actions.onLike(post.id)}
          className="flex flex-col items-center"
        >
          <Heart className={cn("size-7", post.liked ? "fill-like text-like" : "text-foreground")} />
          <span className="text-xs">{post.likeCount}</span>
        </button>
        <button
          type="button"
          aria-label="Comments"
          onClick={() => onOpenComments(post.id)}
          className="flex flex-col items-center"
        >
          <MessageCircle className="size-7" />
          <span className="text-xs">{post.commentCount}</span>
        </button>
        <button
          type="button"
          aria-label={post.saved ? "Remove from saved" : "Save"}
          onClick={() => actions.onSave(post.id)}
        >
          <Bookmark className={cn("size-7", post.saved ? "fill-primary text-primary" : "text-foreground")} />
        </button>
        <button type="button" aria-label="Share" onClick={() => sharePost(post.id, post.caption)}>
          <Send className="size-7" />
        </button>
        {post.mediaType === "video" ? (
          <button
            type="button"
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={() => setMuted((value) => !value)}
          >
            {muted ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />}
          </button>
        ) : null}
        <PostMenu
          onInterested={() => actions.onInterest(post.id, "interested")}
          onNotInterested={() => actions.onInterest(post.id, "not_interested")}
          onReport={() => actions.onReport(post.id)}
          onDownload={() => actions.onDownload(post)}
        />
      </div>

      <div className="absolute inset-x-0 bottom-24 space-y-2 px-4">
        <div className="flex items-center gap-3">
          <Link to="/profile/$userId" params={{ userId: post.author.id }}>
            <Avatar className="size-9 border border-border">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={post.author.username} /> : null}
              <AvatarFallback className="bg-surface-2 text-xs">
                {post.author.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <Link
            to="/profile/$userId"
            params={{ userId: post.author.id }}
            className="text-sm font-semibold"
          >
            @{post.author.username}
          </Link>
        </div>
        {post.caption ? <p className="line-clamp-3 text-sm">{post.caption}</p> : null}
        <div className="flex items-center gap-2">
          <StarRating value={post.myRating} onRate={(stars) => actions.onRate(post.id, stars)} size="sm" />
          {post.ratingCount > 0 ? (
            <span className="text-xs text-muted-foreground">
              {post.avgRating.toFixed(1)} · {post.ratingCount}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
