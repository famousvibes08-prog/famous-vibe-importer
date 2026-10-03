import { Copy, ExternalLink, Send, Share2 } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { shareNatively, sharePost } from "@/lib/share";
import type { FeedPost } from "@/lib/famous.server";

export function ReelShareSheet({ post, open, onOpenChange }: {
  post: FeedPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/v/${post.id.slice(0, 8)}`;
  const text = encodeURIComponent(`${post.caption?.slice(0, 120) || "Watch this reel"} ${url}`);
  const links = [
    { label: "WhatsApp", href: `https://api.whatsapp.com/send?text=${text}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.caption || "Watch this reel")}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${text}` },
  ];

  return <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerContent className="border-border bg-card safe-bottom">
      <DrawerTitle className="px-5 pt-4 text-base">Share reel</DrawerTitle>
      <div className="mx-auto w-full max-w-lg space-y-5 px-5 pt-5 pb-5">
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2">
          <span className="min-w-0 truncate text-xs text-muted-foreground">{url}</span>
          <Button variant="ghost" size="icon" aria-label="Copy link" title="Copy link" onClick={() => void sharePost(post.id)}><Copy /></Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {links.map(({ label, href }) => <Button key={label} asChild variant="secondary" className="h-12 min-w-0 px-2">
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${label}`}><ExternalLink />{label}</a>
          </Button>)}
        </div>
        <Button className="h-12 w-full bg-brand" onClick={() => void shareNatively(post.id, post.caption)}>
          {typeof navigator !== "undefined" && "share" in navigator ? <Share2 /> : <Send />}
          {typeof navigator !== "undefined" && "share" in navigator ? "More apps" : "Copy link"}
        </Button>
      </div>
    </DrawerContent>
  </Drawer>;
}