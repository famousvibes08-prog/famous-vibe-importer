import { useEffect, useState } from "react";
import { Download, EyeOff, Flag, Pencil, ThumbsUp, Trash2 } from "lucide-react";

import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePostActions } from "./usePostActions";
import { useSessionUser } from "@/hooks/use-session";
import type { FeedPost } from "@/lib/famous.server";

type SheetView = "menu" | "edit" | "confirmDelete";

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
  const { userId } = useSessionUser();
  const [view, setView] = useState<SheetView>("menu");
  const [caption, setCaption] = useState(post.caption ?? "");
  const [busy, setBusy] = useState(false);

  const isSelf = Boolean(userId && userId === post.author.id);

  useEffect(() => {
    if (open) {
      setView("menu");
      setCaption(post.caption ?? "");
      setBusy(false);
    }
  }, [open, post.caption]);

  const close = () => onOpenChange(false);

  const run = (fn: () => Promise<unknown>) => () => {
    close();
    void fn();
  };

  const items = [
    ...(isSelf
      ? [
          { icon: Pencil, label: "Edit", onClick: () => setView("edit"), danger: false },
          { icon: Trash2, label: "Delete", onClick: () => setView("confirmDelete"), danger: true },
        ]
      : []),
    { icon: ThumbsUp, label: "Interested", onClick: () => actions.onInterest(post.id, "interested"), danger: false },
    { icon: EyeOff, label: "Not interested", onClick: () => actions.onInterest(post.id, "not_interested"), danger: false },
    { icon: Flag, label: "Report", onClick: () => actions.onReport(post.id), danger: true },
    { icon: Download, label: "Download video", onClick: () => actions.onDownload(post), danger: false },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-3xl border-border bg-card pb-[env(safe-area-inset-bottom,0px)] [&>div:first-child]:mt-3 [&>div:first-child]:h-1 [&>div:first-child]:w-10 [&>div:first-child]:bg-muted-foreground/50">
        <DrawerTitle className="sr-only">Post options</DrawerTitle>
        <DrawerDescription className="sr-only">Choose an action for this reel.</DrawerDescription>

        {view === "menu" ? (
          <ul className="mx-auto w-full max-w-lg px-2 pt-3 pb-5">
            {items.map((item) => (
              <li key={item.label}>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={item.onClick}
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
        ) : null}

        {view === "edit" ? (
          <div className="mx-auto w-full max-w-lg space-y-4 px-5 pt-4 pb-5">
            <p className="text-base font-semibold">Edit reel</p>
            <Textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={2200}
              placeholder="Say something about this vibe…"
              className="min-h-24 bg-surface-2"
              aria-label="Edit caption"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setView("menu")}>
                Back
              </Button>
              <Button
                className="bg-brand flex-1"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void actions
                    .onEditCaption(post.id, caption.trim())
                    .then(() => close())
                    .finally(() => setBusy(false));
                }}
              >
                {busy ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : null}

        {view === "confirmDelete" ? (
          <div className="mx-auto w-full max-w-lg space-y-4 px-5 pt-4 pb-5">
            <p className="text-base font-semibold">Delete this reel?</p>
            <p className="text-sm text-muted-foreground">This removes it everywhere and can't be undone.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setView("menu")}>
                Keep
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void actions
                    .onDelete(post.id)
                    .then(() => close())
                    .finally(() => setBusy(false));
                }}
              >
                {busy ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
