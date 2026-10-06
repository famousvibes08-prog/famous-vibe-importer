import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { BottomNav } from "@/components/famous/BottomNav";
import { Input } from "@/components/ui/input";
import { getFeed } from "@/lib/famous.functions";
import { useSignedUrl } from "@/lib/media";
import type { FeedPost } from "@/lib/famous.server";

function ExploreTile({ post }: { post: FeedPost }) {
  const mediaUrl = useSignedUrl("media", post.mediaUrl);
  return <Link to="/vibes" search={{ post: post.id }} className="relative aspect-square overflow-hidden bg-surface-2">{mediaUrl ? post.mediaType === "video" ? <video src={mediaUrl} muted playsInline preload="metadata" className="size-full object-cover" /> : <img src={mediaUrl} alt={post.caption ?? "Explore post"} className="size-full object-cover" /> : null}</Link>;
}

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [
    { title: "Explore FamousVibe" },
    { name: "description", content: "Search and discover creators, posts and Vibes on FamousVibe." },
    { property: "og:title", content: "Explore FamousVibe" },
    { property: "og:description", content: "Discover trending posts and creators on FamousVibe." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ExplorePage,
});

function ExplorePage() {
  const [query, setQuery] = useState("");
  const fetchFeed = useServerFn(getFeed);
  const { data = [] } = useQuery({ queryKey: ["feed"], queryFn: () => fetchFeed() });
  const filtered = useMemo(() => data.filter((post) => `${post.author.username} ${post.caption ?? ""}`.toLowerCase().includes(query.toLowerCase())), [data, query]);
  return <div className="min-h-screen bg-background pb-24"><header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl"><div className="mx-auto flex max-w-lg items-center gap-2"><Search className="size-5 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search creators and Vibes" className="bg-surface-2" /></div></header><main className="mx-auto grid max-w-lg grid-cols-3 gap-0.5 p-0.5">{filtered.map((post) => <ExploreTile key={post.id} post={post} />)}</main><BottomNav /></div>;
}