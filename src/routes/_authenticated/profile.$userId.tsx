import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/famous/ProfileView";

export const Route = createFileRoute("/_authenticated/profile/$userId")({
  head: () => ({
    meta: [
      { title: "Creator profile — FamousVibe" },
      {
        name: "description",
        content: "Browse this creator's photos and vibe videos, follow them and rate their posts.",
      },
      { property: "og:title", content: "Creator profile on FamousVibe" },
      { property: "og:description", content: "Photos, vibes and ratings from this creator." },
    ],
  }),
  component: CreatorProfile,
});

function CreatorProfile() {
  const { userId } = Route.useParams();
  return <ProfileView userId={userId} />;
}
