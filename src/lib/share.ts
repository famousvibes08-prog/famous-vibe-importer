import { toast } from "sonner";

export function getPostShareUrl(postId: string) {
  return `https://www.famousvibe.com/vibe/${postId}`;
}

export async function sharePost(postId: string, caption?: string | null) {
  const url = getPostShareUrl(postId);
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied", { description: url });
  } catch {
    toast.error("Could not copy the link");
  }
}

export async function shareNatively(postId: string, caption?: string | null) {
  const url = getPostShareUrl(postId);
  if (!navigator.share) {
    await sharePost(postId, caption);
    return;
  }
  try {
    await navigator.share({ title: "FamousVibe", text: caption?.slice(0, 120) || "Watch this reel", url });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    toast.error("Could not open sharing");
  }
}
