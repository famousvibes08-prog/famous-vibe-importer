import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "./AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  followUser,
  getProfile,
  getSavedPosts,
  getUserPosts,
  updateProfile,
} from "@/lib/famous.functions";
import { uploadToBucket, useSignedUrl } from "@/lib/media";
import { supabase } from "@/integrations/supabase/client";
import type { FeedPost } from "@/lib/famous.server";

function PostThumb({ post }: { post: FeedPost }) {
  const url = useSignedUrl("media", post.mediaUrl);
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
      {url ? (
        post.mediaType === "video" ? (
          <video src={url} muted playsInline className="size-full object-cover" />
        ) : (
          <img
            src={url}
            alt={post.caption ?? "Post thumbnail"}
            loading="lazy"
            className="size-full object-cover"
          />
        )
      ) : null}
    </div>
  );
}

function Grid({ posts, empty }: { posts: FeedPost[] | undefined; empty: string }) {
  if (!posts || posts.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {posts.map((post) => (
        <PostThumb key={post.id} post={post} />
      ))}
    </div>
  );
}

export function ProfileView({ userId }: { userId?: string }) {
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const fetchPosts = useServerFn(getUserPosts);
  const fetchSaved = useServerFn(getSavedPosts);
  const toggleFollow = useServerFn(followUser);
  const saveProfile = useServerFn(updateProfile);
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", displayName: "", bio: "" });
  const [busy, setBusy] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", userId ?? "me"],
    queryFn: () => fetchProfile({ data: userId ? { userId } : {} }),
  });

  const postsQuery = useQuery({
    queryKey: ["user-posts", userId ?? "me"],
    queryFn: () => fetchPosts({ data: userId ? { userId } : {} }),
  });

  const isSelf = profileQuery.data?.isSelf ?? false;

  const savedQuery = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => fetchSaved(),
    enabled: isSelf,
  });

  const avatarUrl = useSignedUrl("avatars", profileQuery.data?.avatarUrl ?? null);
  const profile = profileQuery.data;

  async function handleFollow() {
    if (!profile) return;
    try {
      await toggleFollow({ data: { targetId: profile.id } });
      queryClient.invalidateQueries({ queryKey: ["profile", userId ?? "me"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update follow");
    }
  }

  async function handleAvatar(file: File) {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { path } = await uploadToBucket("avatars", auth.user.id, file);
      await saveProfile({
        data: {
          username: profile?.username ?? "",
          displayName: profile?.displayName ?? "",
          bio: profile?.bio ?? "",
          avatarUrl: path,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["profile", userId ?? "me"] });
      toast.success("Avatar updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  }

  async function handleSave() {
    setBusy(true);
    try {
      await saveProfile({
        data: {
          username: form.username.trim().toLowerCase(),
          displayName: form.displayName,
          bio: form.bio,
          avatarUrl: null,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["profile", userId ?? "me"] });
      setEditing(false);
      toast.success("Profile saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  if (profileQuery.isLoading) {
    return (
      <AppShell>
        <p className="py-16 text-center text-sm text-muted-foreground">Loading profile…</p>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">This profile isn't available.</p>
          <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary">
            Back to feed
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="sr-only">@{profile.username} on FamousVibe</h1>

      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={!isSelf}
          onClick={() => fileRef.current?.click()}
          className="ring-brand rounded-full"
        >
          <Avatar className="size-20 border-2 border-card">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={profile.username} /> : null}
            <AvatarFallback className="bg-surface-2">
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleAvatar(file);
          }}
        />

        <dl className="flex flex-1 justify-around text-center">
          <div>
            <dt className="text-xs text-muted-foreground">Posts</dt>
            <dd className="text-base font-semibold">{profile.counts.posts}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Followers</dt>
            <dd className="text-base font-semibold">{profile.counts.followers}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Following</dt>
            <dd className="text-base font-semibold">{profile.counts.following}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold">{profile.displayName || profile.username}</p>
        <p className="text-xs text-muted-foreground">@{profile.username}</p>
        {profile.bio ? <p className="mt-2 text-sm">{profile.bio}</p> : null}
      </div>

      <div className="mt-4">
        {isSelf ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setForm({
                username: profile.username,
                displayName: profile.displayName ?? "",
                bio: profile.bio ?? "",
              });
              setEditing((value) => !value);
            }}
          >
            {editing ? "Cancel" : "Edit profile"}
          </Button>
        ) : (
          <Button
            onClick={handleFollow}
            className={profile.following ? "w-full" : "bg-brand w-full shadow-neon"}
            variant={profile.following ? "outline" : "default"}
          >
            {profile.following ? "Following" : "Follow"}
          </Button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-border bg-surface p-4">
          <div className="space-y-2">
            <Label htmlFor="edit-username">Username</Label>
            <Input
              id="edit-username"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              className="bg-surface-2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-name">Display name</Label>
            <Input
              id="edit-name"
              value={form.displayName}
              onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              className="bg-surface-2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-bio">Bio</Label>
            <Textarea
              id="edit-bio"
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
              maxLength={300}
              className="bg-surface-2"
            />
          </div>
          <Button onClick={handleSave} disabled={busy} className="bg-brand w-full">
            {busy ? "Saving…" : "Save profile"}
          </Button>
        </div>
      ) : null}

      <div className="mt-6">
        {isSelf ? (
          <Tabs defaultValue="posts">
            <TabsList className="w-full">
              <TabsTrigger value="posts" className="flex-1">
                Posts
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex-1">
                Saved
              </TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="mt-4">
              <Grid posts={postsQuery.data} empty="No posts yet — create your first vibe." />
            </TabsContent>
            <TabsContent value="saved" className="mt-4">
              <Grid posts={savedQuery.data} empty="Nothing saved yet." />
            </TabsContent>
          </Tabs>
        ) : (
          <Grid posts={postsQuery.data} empty="No posts yet." />
        )}
      </div>
    </AppShell>
  );
}
