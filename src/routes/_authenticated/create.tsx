import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/famous/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "@/lib/famous.functions";
import { uploadToBucket } from "@/lib/media";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/create")({
  head: () => ({
    meta: [
      { title: "Create a post — FamousVibe" },
      {
        name: "description",
        content: "Upload a photo or short video, add a caption and publish it to your FamousVibe feed.",
      },
      { property: "og:title", content: "Create a post on FamousVibe" },
      { property: "og:description", content: "Publish photos and short vibe videos in seconds." },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const submit = useServerFn(createPost);
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isVibe, setIsVibe] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setIsVibe(file.type.startsWith("video/"));
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const mediaType: "image" | "video" = file?.type.startsWith("video/") ? "video" : "image";

  async function handlePublish() {
    if (!file) return;
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("You need to be signed in");
      const { path } = await uploadToBucket("media", auth.user.id, file);
      await submit({ data: { mediaPath: path, mediaType, caption: caption.trim(), isVibe } });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["vibes"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      toast.success("Posted");
      navigate({ to: isVibe ? "/vibes" : "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-lg font-semibold">Create</h1>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="grid aspect-square w-full place-items-center overflow-hidden rounded-3xl border border-dashed border-border bg-surface"
      >
        {preview ? (
          mediaType === "video" ? (
            <video src={preview} className="size-full object-cover" controls playsInline />
          ) : (
            <img src={preview} alt="Selected media preview" className="size-full object-cover" />
          )
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImagePlus className="size-8" />
            <span className="text-sm">Tap to pick a photo or video</span>
          </span>
        )}
      </button>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="caption">Caption</Label>
          <Textarea
            id="caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={2200}
            placeholder="Say something about this vibe…"
            className="min-h-24 bg-surface-2"
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
          <div>
            <p className="text-sm font-medium">Post as a Vibe</p>
            <p className="text-xs text-muted-foreground">Shows in the full-screen Vibes feed</p>
          </div>
          <Switch checked={isVibe} onCheckedChange={setIsVibe} aria-label="Post as a Vibe" />
        </div>

        <Button
          type="button"
          onClick={handlePublish}
          disabled={!file || busy}
          className="bg-brand w-full shadow-neon"
        >
          {busy ? "Publishing…" : "Publish"}
        </Button>
      </div>
    </AppShell>
  );
}
