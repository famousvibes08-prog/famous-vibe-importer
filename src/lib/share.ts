import { toast } from "sonner";

export function getPostShareUrl(postId: string) {
  return `https://www.famousvibe.com/vibe/${postId}`;
}

export async function sharePost(postId: string) {
  const url = getPostShareUrl(postId);
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied", { description: url });
  } catch {
    toast.error("Could not copy the link");
  }
}

/** Shares only the clean reel URL — no title, caption or extra text. */
export async function shareNatively(postId: string) {
  const url = getPostShareUrl(postId);
  if (typeof navigator.share !== "function") {
    await sharePost(postId);
    return;
  }
  try {
    await navigator.share({ url });
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "AbortError") return;
    await sharePost(postId);
  }
}
