import { Download, EyeOff, Flag, Link2 } from "lucide-react";

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
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
    {
      icon: Link2,
      label: "Copy link",
      onClick: () => sharePost(post.id),
    },
    { icon: EyeOff, label: "Not interested", onClick: () => actions.onInterest(post.id, "not_interested") },
    { icon: Download, label: "Download video", onClick: () => actions.onDownload(post) },
    { icon: Flag, label: "Report", danger: true, onClick: () => actions.onReport(post.id) },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-border bg-card">
        <DrawerTitle className="sr-only">Post options</DrawerTitle>
        <ul className="mx-auto w-full max-w-lg px-2 pt-2 pb-8">
          {items.map((item) => (
            <li key={item.label}>
              <Button
                variant="ghost"
                type="button"
                onClick={run(item.onClick)}
                className={`h-12 w-full justify-start gap-4 px-4 text-left text-sm font-medium hover:bg-surface-2 ${
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
