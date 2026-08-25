import { toast } from "sonner";

export async function sharePost(postId: string, caption?: string | null) {
  const url = `${window.location.origin}/?post=${postId}`;
  const shareData = {
    title: "FamousVibe",
    text: caption?.slice(0, 120) || "Check out this vibe",
    url,
  };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  } catch {
    toast.error("Could not share this post");
  }
}
