import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Story } from "@/lib/famous.server";
import { useSignedUrl } from "@/lib/media";

function StoryMedia({ story, onDone }: { story: Story; onDone: () => void }) {
  const mediaUrl = useSignedUrl("media", story.mediaUrl);
  if (!mediaUrl) return <div className="grid size-full place-items-center text-sm text-muted-foreground">Loading story…</div>;
  return story.mediaType === "video" ? (
    <video src={mediaUrl} autoPlay playsInline onEnded={onDone} className="size-full object-cover" />
  ) : <img src={mediaUrl} alt={story.caption ?? `Story by ${story.author.username}`} className="size-full object-cover" />;
}

export function StoryViewer({ stories, initialIndex, onClose }: { stories: Story[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const story = stories[index];
  const avatarUrl = useSignedUrl("avatars", story?.author.avatarUrl ?? null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const next = () => setIndex((current) => current >= stories.length - 1 ? (closeRef.current(), current) : current + 1);
  const previous = () => setIndex((current) => Math.max(0, current - 1));

  useEffect(() => {
    setProgress(0);
    if (!story || story.mediaType === "video") return;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const nextProgress = Math.min(1, (now - started) / 5000);
      setProgress(nextProgress);
      if (nextProgress >= 1) next();
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [index, story?.id]);

  if (!story) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={`${story.author.username}'s story`} className="fixed inset-0 z-[80] bg-background">
      <div className="relative mx-auto h-[100dvh] w-full max-w-[calc(100dvh*9/16)] overflow-hidden bg-surface">
        <StoryMedia key={story.id} story={story} onDone={next} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background/40" />
        <div className="absolute inset-x-0 top-0 z-10 p-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
          <div className="mb-3 flex gap-1">{stories.map((item, itemIndex) => <span key={item.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-foreground/30"><span className="block h-full bg-foreground transition-[width] duration-100" style={{ width: itemIndex < index ? "100%" : itemIndex > index ? "0%" : `${progress * 100}%` }} /></span>)}</div>
          <div className="flex items-center gap-2">
            <Avatar className="size-9 border border-border">{avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}<AvatarFallback>{story.author.username.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
            <span className="text-sm font-semibold">@{story.author.username}</span>
            <span className="text-xs text-muted-foreground">{new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.max(-23, Math.round((new Date(story.createdAt).getTime() - Date.now()) / 3_600_000)), "hour")}</span>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close stories" className="ml-auto"><X /></Button>
          </div>
        </div>
        {story.caption ? <p className="absolute inset-x-4 bottom-10 z-10 text-center text-sm font-medium drop-shadow-lg">{story.caption}</p> : null}
        <button type="button" aria-label="Previous story" className="absolute inset-y-20 left-0 z-10 w-1/2" onClick={previous} />
        <button type="button" aria-label="Next story" className="absolute inset-y-20 right-0 z-10 w-1/2" onClick={next} />
      </div>
    </div>
  );
}