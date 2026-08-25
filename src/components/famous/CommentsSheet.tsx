import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { addComment, getComments } from "@/lib/famous.functions";
import { useSignedUrl } from "@/lib/media";

function CommentAvatar({ path, name }: { path: string | null; name: string }) {
  const url = useSignedUrl("avatars", path);
  return (
    <Avatar className="size-8">
      {url ? <AvatarImage src={url} alt={name} /> : null}
      <AvatarFallback className="bg-surface-2 text-xs">
        {name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

export function CommentsSheet({
  postId,
  open,
  onOpenChange,
}: {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();
  const fetchComments = useServerFn(getComments);
  const submitComment = useServerFn(addComment);

  const { data, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchComments({ data: { postId: postId! } }),
    enabled: Boolean(postId) && open,
  });

  const mutation = useMutation({
    mutationFn: (text: string) => submitComment({ data: { postId: postId!, body: text } }),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["vibes"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[75vh] flex-col bg-surface p-0">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle>Comments</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading comments…</p>
          ) : (data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
          ) : (
            data!.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <CommentAvatar path={comment.author.avatarUrl} name={comment.author.username} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">@{comment.author.username}</p>
                  <p className="text-sm break-words text-muted-foreground">{comment.body}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form
          className="safe-bottom flex items-center gap-2 border-t border-border px-4 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (body.trim()) mutation.mutate(body.trim());
          }}
        >
          <Input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Add a comment…"
            maxLength={1000}
            className="bg-surface-2"
          />
          <Button type="submit" disabled={!body.trim() || mutation.isPending} className="bg-brand">
            Post
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
