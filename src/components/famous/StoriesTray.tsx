import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/hooks/use-session";
import { createStory, getStories } from "@/lib/famous.functions";
import type { Story } from "@/lib/famous.server";
import { uploadToBucket, useSignedUrl } from "@/lib/media";
import { supabase } from "@/integrations/supabase/client";
import { StoryViewer } from "./StoryViewer";

function StoryBubble({ story, onClick }: { story: Story; onClick: () => void }) {
  const avatarUrl = useSignedUrl("avatars", story.author.avatarUrl);
  return (
    <li className="w-[4.5rem] shrink-0 text-center">
      <Button variant="ghost" type="button" onClick={onClick} className="h-auto w-full flex-col gap-1 p-0 hover:bg-transparent">
        <span className="ring-brand rounded-full">
          <Avatar className="size-14 border-2 border-background">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={story.author.username} /> : null}
            <AvatarFallback className="bg-surface-2 text-xs">{story.author.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </span>
        <span className="w-full truncate text-[11px]">{story.author.username}</span>
      </Button>
    </li>
  );
}

export function StoriesTray() {
  const listStories = useServerFn(getStories);
  const addStory = useServerFn(createStory);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { userId } = useSessionUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const { data = [] } = useQuery({ queryKey: ["stories"], queryFn: () => listStories() });

  async function uploadStory(file: File) {
    if (!userId) {
      navigate({ to: "/auth" });
      return;
    }
    setUploading(true);
    try {
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      const { path } = await uploadToBucket("media", userId, file);
      await addStory({ data: { mediaPath: path, mediaType } });
      await queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Your story is live for 24 hours");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Story upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <section aria-label="Stories" className="absolute inset-x-0 top-14 z-20 mx-auto max-w-lg border-b border-border bg-background/80 px-3 py-2 backdrop-blur-xl">
        <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadStory(file); }} />
        <ul className="no-scrollbar flex gap-3 overflow-x-auto">
          <li className="w-[4.5rem] shrink-0 text-center">
            <Button variant="ghost" type="button" disabled={uploading} onClick={() => userId ? inputRef.current?.click() : navigate({ to: "/auth" })} className="h-auto w-full flex-col gap-1 p-0 hover:bg-transparent">
              <span className="relative grid size-14 place-items-center rounded-full border border-border bg-surface-2">
                <Avatar className="size-full"><AvatarFallback className="bg-surface-2">You</AvatarFallback></Avatar>
                <span className="absolute right-0 bottom-0 grid size-5 place-items-center rounded-full bg-primary ring-2 ring-background"><Plus className="size-3.5" /></span>
              </span>
              <span className="text-[11px]">{uploading ? "Uploading…" : "Your story"}</span>
            </Button>
          </li>
          {data.map((story, index) => <StoryBubble key={story.id} story={story} onClick={() => setViewerIndex(index)} />)}
        </ul>
      </section>
      {viewerIndex !== null ? <StoryViewer stories={data} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} /> : null}
    </>
  );
}