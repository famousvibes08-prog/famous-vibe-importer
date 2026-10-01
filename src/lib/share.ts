import { toast } from "sonner";

export async function sharePost(postId: string, caption?: string | null) {
  const url = `${window.location.origin}/v/${postId.slice(0, 8)}`;
  const shareData = {
    title: "FamousVibe",
    text: caption?.slice(0, 120) || "Check out this vibe",
    url,
  };

  void shareData;
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Short link copied", { description: url });
  } catch {
    toast.error("Could not share this post");
  }
}
