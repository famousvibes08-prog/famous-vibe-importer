import { useNavigate } from "@tanstack/react-router";
import { Bookmark, Download, EyeOff, Flag, Link2, UserRound } from "lucide-react";

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
  const navigate = useNavigate();
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
    { icon: Bookmark, label: post.saved ? "Remove from saved" : "Save", onClick: () => actions.onSave(post.id) },
    { icon: EyeOff, label: "Not interested", onClick: () => actions.onInterest(post.id, "not_interested") },
    {
      icon: UserRound,
      label: "About this creator",
      onClick: () => navigate({ to: "/profile/$userId", params: { userId: post.author.id } }),
    },
    { icon: Download, label: "Download", onClick: () => actions.onDownload(post) },
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
