import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, MoreHorizontal, Music2, Send } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReelActionSheet } from "./ReelActionSheet";
import { StarRating } from "./StarRating";
import { usePostActions } from "./usePostActions";
import { useSessionUser } from "@/hooks/use-session";
import { useSignedUrl } from "@/lib/media";
import { sharePost } from "@/lib/share";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/lib/famous.server";

// Browsers block unmuted autoplay until the first user gesture. We start with sound,
// fall back to silent playback only if blocked, and turn sound on at the first tap.
let soundUnlocked = false;
function unlockSoundOnce() {
  if (soundUnlocked || typeof document === "undefined") return;
  const unlock = () => {
    soundUnlocked = true;
    document.querySelectorAll<HTMLVideoElement>("video[data-reel]").forEach((v) => {
      v.muted = false;
    });
  };
  document.addEventListener("pointerdown", unlock, { once: true, capture: true });
}

async function playWithSound(video: HTMLVideoElement) {
  video.muted = false;
  try {
    await video.play();
  } catch {
    video.muted = true;
    unlockSoundOnce();
    await video.play().catch(() => undefined);
  }
}

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
  const { userId } = useSessionUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef(0);
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [following, setFollowing] = useState(post.followingAuthor);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [bump, setBump] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setLiked(post.liked);
    setLikeCount(post.likeCount);
    setFollowing(post.followingAuthor);
  }, [post.liked, post.likeCount, post.followingAuthor]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        if (entry && entry.isIntersecting) void playWithSound(video);
        else {
          video.pause();
          video.currentTime = 0;
        }
      },
      { threshold: 0.65 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [mediaUrl]);

  const doLike = (forceOn = false) => {
    if (forceOn && liked) return;
    if (!userId) {
      void actions.onLike(post.id);
      return;
    }
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    setBump((b) => b + 1);
    void actions.onLike(post.id);
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      const rect = e.currentTarget.getBoundingClientRect();
      const id = now;
      setHearts((h) => [...h, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 900);
      doLike(true);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    const video = videoRef.current;
    setTimeout(() => {
      if (lastTap.current !== now || !video) return;
      if (video.paused) void playWithSound(video);
      else video.pause();
    }, 300);
  };

  const isSelf = userId === post.author.id;

  return (
    <div
      ref={containerRef}
      id={`reel-${post.id}`}
      className="relative mx-auto h-[100dvh] w-full max-w-[calc(100dvh*9/16)] snap-start snap-always overflow-hidden bg-background"
    >
      <div className="absolute inset-0" onClick={handleTap}>
        {mediaUrl ? (
          post.mediaType === "video" ? (
            <video
              ref={videoRef}
              data-reel
              src={mediaUrl}
              loop
              playsInline
              preload="metadata"
              className="size-full object-cover"
            />
          ) : (
            <img src={mediaUrl} alt={post.caption ?? "Vibe"} className="size-full object-cover" />
          )
        ) : null}
        {hearts.map((h) => (
          <Heart
            key={h.id}
            className="heart-pop pointer-events-none absolute size-24 fill-like text-like"
            style={{ left: h.x - 48, top: h.y - 48 }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/40" />

      <div className="absolute right-2 bottom-28 flex flex-col items-center gap-5">
        <button
          type="button"
          aria-label={liked ? "Unlike" : "Like"}
          onClick={() => doLike()}
          className="flex flex-col items-center gap-1"
        >
          <Heart
            key={bump}
            className={cn(
              "size-8 transition-colors",
              bump > 0 && "like-bump",
              liked ? "fill-like text-like drop-shadow-[0_0_12px_var(--color-like)]" : "text-foreground",
            )}
          />
          <span key={`c${likeCount}`} className="count-tick text-xs font-semibold">
            {likeCount}
          </span>
        </button>
        <button
          type="button"
          aria-label="Comments"
          onClick={() => onOpenComments(post.id)}
          className="flex flex-col items-center gap-1"
        >
          <MessageCircle className="size-8" />
          <span className="text-xs font-semibold">{post.commentCount}</span>
        </button>
        <button
          type="button"
          aria-label="Share"
          onClick={() => sharePost(post.id, post.caption)}
          className="flex flex-col items-center gap-1"
        >
          <Send className="size-8" />
          <span className="text-xs font-semibold">Share</span>
        </button>
        <button type="button" aria-label="More options" onClick={() => setMenuOpen(true)}>
          <MoreHorizontal className="size-8" />
        </button>
        <Avatar className="size-9 rounded-lg border-2 border-foreground">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="rounded-lg bg-brand text-[10px]">♪</AvatarFallback>
        </Avatar>
      </div>

      <div className="absolute inset-x-0 bottom-24 space-y-2 pr-20 pl-4">
        <div className="flex items-center gap-2">
          <Link to="/profile/$userId" params={{ userId: post.author.id }} className="ring-brand rounded-full">
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
            className="truncate text-sm font-semibold"
          >
            @{post.author.username}
          </Link>
          {!isSelf ? (
            <button
              type="button"
              onClick={() => {
                if (userId) setFollowing((f) => !f);
                void actions.onFollow(post.author.id);
              }}
              className={cn(
                "rounded-lg border px-3 py-1 text-xs font-semibold transition-all",
                following
                  ? "border-border bg-surface-2/60 text-foreground"
                  : "border-transparent bg-brand text-primary-foreground shadow-neon",
              )}
            >
              {following ? "Following" : "Follow"}
            </button>
          ) : null}
        </div>
        {post.caption ? <p className="line-clamp-2 text-sm">{post.caption}</p> : null}
        <div className="flex items-center gap-2 overflow-hidden text-xs">
          <Music2 className="size-3.5 shrink-0" />
          <span className="truncate">Original sound · @{post.author.username}</span>
        </div>
        <div className="flex items-center gap-2">
          <StarRating value={post.myRating} onRate={(stars) => actions.onRate(post.id, stars)} size="sm" />
          {post.ratingCount > 0 ? (
            <span className="text-xs text-muted-foreground">
              {post.avgRating.toFixed(1)} · {post.ratingCount}
            </span>
          ) : null}
        </div>
      </div>

      <ReelActionSheet open={menuOpen} onOpenChange={setMenuOpen} post={post} />
    </div>
  );
}
