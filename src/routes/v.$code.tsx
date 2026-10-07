import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";

import { resolveShortLink } from "@/lib/famous.functions";

export const Route = createFileRoute("/v/$code")({
  head: () => ({
    meta: [
      { title: "Watch this vibe — FamousVibe" },
      { name: "description", content: "A short video shared from FamousVibe." },
      { property: "og:title", content: "Watch this vibe on FamousVibe" },
      { property: "og:description", content: "A short video shared from FamousVibe." },
      { property: "og:type", content: "video.other" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShortLink,
});

function ShortLink() {
  const { code } = Route.useParams();
  const resolve = useServerFn(resolveShortLink);
  const navigate = useNavigate();

  useEffect(() => {
    resolve({ data: { code: code.toLowerCase() } })
      .then((r) => navigate({ to: "/vibes", search: r.postId ? { post: r.postId } : {}, replace: true }))
      .catch(() => navigate({ to: "/", replace: true }));
  }, [code, resolve, navigate]);

  return (
    <div className="grid h-[100dvh] place-items-center text-sm text-muted-foreground">Opening vibe…</div>
  );
}
