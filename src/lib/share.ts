import { toast } from "sonner";

export async function sharePost(postId: string, caption?: string | null) {
  const url = `${window.location.origin}/v/${postId.slice(0, 8)}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Short link copied", { description: url });
  } catch {
    toast.error("Could not copy the link");
  }
}

export async function shareNatively(postId: string, caption?: string | null) {
  const url = `${window.location.origin}/v/${postId.slice(0, 8)}`;
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
