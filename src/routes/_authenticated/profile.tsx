import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/famous/ProfileView";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — FamousVibe" },
      {
        name: "description",
        content: "Manage your FamousVibe profile, avatar, bio, posts and saved vibes.",
      },
      { property: "og:title", content: "Your profile on FamousVibe" },
      { property: "og:description", content: "Your posts, saved vibes and follower stats." },
    ],
  }),
  component: () => <ProfileView />,
});
