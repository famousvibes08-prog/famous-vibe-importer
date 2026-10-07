import { Download, EyeOff, Flag, Link2, ThumbsUp } from "lucide-react";

import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { sharePost } from "@/lib/share";
import { usePostActions } from "./usePostActions";
import type { FeedPost } from "@/lib/famous.server";

export function ReelActionSheet({
  open,
  onOpenChange,
  post,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: FeedPost;
}) {
  const actions = usePostActions();
  const run = (fn: () => unknown) => () => {
    onOpenChange(false);
    void fn();
  };

  const items = [
    { icon: ThumbsUp, label: "Interested", onClick: () => actions.onInterest(post.id, "interested") },
    { icon: EyeOff, label: "Not interested", onClick: () => actions.onInterest(post.id, "not_interested") },
    { icon: Flag, label: "Report", danger: true, onClick: () => actions.onReport(post.id) },
    {
      icon: Link2,
      label: "Copy link",
      onClick: () => sharePost(post.id),
    },
    { icon: Download, label: "Download video", onClick: () => actions.onDownload(post) },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-3xl border-border bg-card pb-[env(safe-area-inset-bottom,0px)] [&>div:first-child]:mt-3 [&>div:first-child]:h-1 [&>div:first-child]:w-10 [&>div:first-child]:bg-muted-foreground/50">
        <DrawerTitle className="sr-only">Post options</DrawerTitle>
        <DrawerDescription className="sr-only">Choose an action for this reel.</DrawerDescription>
        <ul className="mx-auto w-full max-w-lg px-2 pt-3 pb-5">
          {items.map((item) => (
            <li key={item.label}>
              <Button
                variant="ghost"
                type="button"
                onClick={run(item.onClick)}
                className={`h-14 w-full justify-start gap-4 rounded-md px-4 text-left text-sm font-medium hover:bg-surface-2 ${
                  item.danger ? "text-destructive" : ""
                }`}
              >
                <item.icon className="size-5" />
                {item.label}
              </Button>
            </li>
          ))}
        </ul>
      </DrawerContent>
    </Drawer>
  );
}
