import { useNavigate } from "@tanstack/react-router";
import { Bookmark, Download, EyeOff, Flag, Link2, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
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
      onClick: async () => {
        const url = `${window.location.origin}/v/${post.id.slice(0, 8)}`;
        await navigator.clipboard.writeText(url).catch(() => undefined);
        toast.success("Link copied", { description: url });
      },
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
              <button
                type="button"
                onClick={run(item.onClick)}
                className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-colors hover:bg-surface-2 ${
                  item.danger ? "text-destructive" : ""
                }`}
              >
                <item.icon className="size-5" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </DrawerContent>
    </Drawer>
  );
}
