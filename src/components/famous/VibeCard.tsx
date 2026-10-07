import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Camera, Disc3, Heart, MessageCircle, MoreHorizontal, Play, Plus, Send } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ReelActionSheet } from "./ReelActionSheet";
import { StarRating } from "./StarRating";
import { usePostActions } from "./usePostActions";
import { useSessionUser } from "@/hooks/use-session";
import { useSignedUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/lib/famous.server";
import { shareNatively } from "@/lib/share";

async function playWithSound(video: HTMLVideoElement): Promise<boolean> {
  document.querySelectorAll<HTMLVideoElement>("video[data-reel]").forEach((other) => {
    if (other !== video) other.pause();
  });
  video.muted = false;
  try {
    await video.play();
    return true;
  } catch {
    return false;
  }
}

export function VibeCard({
  post,
  onOpenComments,
  compactHeight = false,
}: {
  post: FeedPost;
  onOpenComments: (postId: string) => void;
  compactHeight?: boolean;
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
  const [saved, setSaved] = useState(post.saved);
  const [needsPlay, setNeedsPlay] = useState(false);
  const activeRef = useRef(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLiked(post.liked);
    setLikeCount(post.likeCount);
    setFollowing(post.followingAuthor);
    setSaved(post.saved);
  }, [post.liked, post.likeCount, post.followingAuthor, post.saved]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        activeRef.current = Boolean(entry?.isIntersecting);
        if (activeRef.current) void playWithSound(video).then((playing) => setNeedsPlay(!playing));
        else {
          video.pause();
        }
      },
      { threshold: 0.51 },
    );
    observer.observe(node);
    const unlock = () => {
      const video = videoRef.current;
      if (video && activeRef.current && video.paused) {
        void playWithSound(video).then((playing) => setNeedsPlay(!playing));
      }
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", unlock);
      videoRef.current?.pause();
      if (tapTimer.current) clearTimeout(tapTimer.current);
    };
  }, [mediaUrl]);

  const doLike = (forceOn = false) => {
    if (forceOn && liked) return;
    if (!userId) {
      void actions.onLike(post.id);
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    setBump((b) => b + 1);
    void actions.onLike(post.id).then((success) => {
      if (!success) {
        setLiked(wasLiked);
        setLikeCount((c) => c + (wasLiked ? 1 : -1));
      }
    });
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
    tapTimer.current = setTimeout(() => {
      if (lastTap.current !== now || !video || !activeRef.current) return;
      if (video.paused) void playWithSound(video).then((playing) => setNeedsPlay(!playing));
      else video.pause();
    }, 300);
  };

  const isSelf = userId === post.author.id;

  return (
    <div
      ref={containerRef}
      id={`reel-${post.id}`}
      className={cn("relative mx-auto w-full snap-start snap-always overflow-hidden bg-background", compactHeight ? "h-[calc(100dvh-8.5rem)] max-w-[calc((100dvh-8.5rem)*9/16)]" : "h-[calc(100dvh-5rem-env(safe-area-inset-bottom,0px))] max-w-[calc((100dvh-5rem)*9/16)]")}
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
               className="size-full object-contain"
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

      <div className="absolute inset-x-0 top-0 z-10 flex h-16 items-center justify-between px-4">
        <span className="text-xl font-semibold">Vibe</span>
        <Button asChild variant="ghost" size="icon" className="size-11 [&_svg]:size-7">
          <Link to="/create" aria-label="Camera — upload a reel" title="Upload a reel"><Camera /></Link>
        </Button>
      </div>
      {needsPlay && post.mediaType === "video" ? <Button variant="ghost" size="icon" aria-label="Play video" className="absolute top-1/2 left-1/2 z-10 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/50 [&_svg]:size-8" onClick={() => {
        const video = videoRef.current;
        if (video) void playWithSound(video).then((playing) => setNeedsPlay(!playing));
      }}><Play /></Button> : null}

      <div className="absolute right-1 bottom-5 z-10 flex w-14 flex-col items-center gap-3">
        <Button
          variant="ghost"
          type="button"
          aria-label={liked ? "Unlike" : "Like"}
          onClick={() => doLike()}
          className="flex h-auto min-h-12 w-12 flex-col items-center gap-1 p-1 hover:bg-transparent [&_svg]:size-8"
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
        </Button>
        <Button
          variant="ghost"
          type="button"
          aria-label="Comments"
          onClick={() => onOpenComments(post.id)}
          className="flex h-auto min-h-12 w-12 flex-col items-center gap-1 p-1 hover:bg-transparent [&_svg]:size-8"
        >
          <MessageCircle className="size-8" />
          <span className="text-xs font-semibold">{post.commentCount}</span>
        </Button>
        <Button
          variant="ghost"
          type="button"
          aria-label="Share"
          onClick={() => {
            void shareNatively(post.id, post.caption);
          }}
          className="flex h-auto min-h-12 w-12 flex-col items-center gap-1 p-1 hover:bg-transparent [&_svg]:size-8"
        >
          <Send className="size-8" />
        </Button>
        <Button
          variant="ghost"
          type="button"
          aria-label={saved ? "Remove from saved" : "Save"}
          onClick={() => {
            if (!userId) { void actions.onSave(post.id); return; }
            const wasSaved = saved;
            setSaved(!wasSaved);
            void actions.onSave(post.id).then((success) => { if (!success) setSaved(wasSaved); });
          }}
          className="flex h-auto min-h-12 w-12 flex-col items-center gap-1 p-1 hover:bg-transparent [&_svg]:size-8"
        >
          <Bookmark className={cn("size-8", saved && "fill-foreground")} />
        </Button>
        <div className="rounded-md bg-background/45 p-1 backdrop-blur-sm [&>div]:flex-col">
          <StarRating value={post.myRating} onRate={(stars) => actions.onRate(post.id, stars)} size="sm" />
        </div>
        <Button variant="ghost" size="icon" type="button" aria-label="More options" title="More options" onClick={() => setMenuOpen(true)} className="size-12 hover:bg-transparent [&_svg]:size-8">
          <MoreHorizontal className="size-8" />
        </Button>
      </div>

      <div className="pointer-events-none absolute right-16 bottom-5 left-0 space-y-3 pr-2 pl-4 [&>*]:pointer-events-auto">
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
            className="min-w-0 truncate text-sm font-semibold"
          >
            @{post.author.username}
          </Link>
          {!isSelf ? (
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                if (!userId) {
                  void actions.onFollow(post.author.id);
                  return;
                }
                const wasFollowing = following;
                setFollowing(!wasFollowing);
                void actions.onFollow(post.author.id).then((success) => {
                  if (!success) setFollowing(wasFollowing);
                });
              }}
              className={cn(
                "h-8 shrink-0 rounded-md border px-2 text-xs font-semibold transition-all",
                following
                  ? "border-border bg-surface-2/60 text-foreground"
                  : "border-transparent bg-brand text-primary-foreground shadow-neon",
              )}
            >
              {!following ? <Plus className="size-3" /> : null}{following ? "Following" : "Follow"}
            </Button>
          ) : null}
        </div>
        {post.caption ? <p className="line-clamp-2 text-sm">{post.caption}</p> : null}
        <div className="flex items-center gap-2 overflow-hidden text-xs">
          <span className="reel-disc grid size-7 shrink-0 place-items-center rounded-full border border-foreground/60 bg-surface-2"><Disc3 className="size-5" /></span>
          <span className="min-w-0 overflow-hidden"><span className="reel-track"><span className="pr-8">Original sound · @{post.author.username}</span><span className="pr-8" aria-hidden="true">Original sound · @{post.author.username}</span></span></span>
        </div>
        <div className="flex items-center gap-2">
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
