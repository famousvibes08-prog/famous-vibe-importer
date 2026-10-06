import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/vibe/$postId")({
  head: ({ params }) => ({ meta: [
    { title: "Shared reel — FamousVibe" },
    { name: "description", content: "Watch this shared FamousVibe reel and discover its creator." },
    { property: "og:title", content: "Shared reel on FamousVibe" },
    { property: "og:description", content: "Open this reel in the FamousVibe vertical video player." },
    { property: "og:type", content: "video.other" },
    { name: "twitter:card", content: "summary_large_image" },
    ...(!/^[0-9a-f-]{36}$/i.test(params.postId) ? [{ name: "robots", content: "noindex" }] : []),
  ] }),
  component: SharedReel,
});

function SharedReel() {
  const { postId } = Route.useParams();
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({ to: "/vibes", search: { post: postId }, replace: true });
  }, [navigate, postId]);
  return <div className="grid h-dvh place-items-center text-muted-foreground">Opening reel…</div>;
}