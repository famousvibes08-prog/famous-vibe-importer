import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Client = SupabaseClient<Database>;

export type Author = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type FeedPost = {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string | null;
  isVibe: boolean;
  likeCount: number;
  commentCount: number;
  avgRating: number;
  ratingCount: number;
  createdAt: string;
  author: Author;
  liked: boolean;
  saved: boolean;
  myRating: number | null;
};

const POST_COLUMNS =
  "id,user_id,media_url,media_type,caption,is_vibe,like_count,comment_count,avg_rating,rating_count,created_at";

function toAuthor(row: {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}): Author {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  };
}

async function decorate(
  supabase: Client,
  userId: string,
  rows: Array<Record<string, unknown>>,
): Promise<FeedPost[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r["id"] as string);
  const authorIds = Array.from(new Set(rows.map((r) => r["user_id"] as string)));

  const [profiles, likes, saves, ratings] = await Promise.all([
    supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", authorIds),
    supabase.from("likes").select("post_id").eq("user_id", userId).in("post_id", ids),
    supabase.from("saves").select("post_id").eq("user_id", userId).in("post_id", ids),
    supabase.from("ratings").select("post_id,stars").eq("user_id", userId).in("post_id", ids),
  ]);

  const authorMap = new Map<string, Author>(
    (profiles.data ?? []).map((p) => [p.id, toAuthor(p)] as const),
  );
  const likedSet = new Set((likes.data ?? []).map((r) => r.post_id));
  const savedSet = new Set((saves.data ?? []).map((r) => r.post_id));
  const ratingMap = new Map((ratings.data ?? []).map((r) => [r.post_id, r.stars] as const));

  return rows.map((r) => {
    const authorId = r["user_id"] as string;
    return {
      id: r["id"] as string,
      userId: authorId,
      mediaUrl: r["media_url"] as string,
      mediaType: r["media_type"] as "image" | "video",
      caption: (r["caption"] as string | null) ?? null,
      isVibe: Boolean(r["is_vibe"]),
      likeCount: Number(r["like_count"] ?? 0),
      commentCount: Number(r["comment_count"] ?? 0),
      avgRating: Number(r["avg_rating"] ?? 0),
      ratingCount: Number(r["rating_count"] ?? 0),
      createdAt: r["created_at"] as string,
      author:
        authorMap.get(authorId) ??
        ({ id: authorId, username: "unknown", displayName: null, avatarUrl: null } as Author),
      liked: likedSet.has(r["id"] as string),
      saved: savedSet.has(r["id"] as string),
      myRating: ratingMap.get(r["id"] as string) ?? null,
    };
  });
}

function rank(posts: FeedPost[]): FeedPost[] {
  const now = Date.now();
  const maxEngagement = Math.max(1, ...posts.map((p) => p.likeCount + p.commentCount * 2));
  return posts
    .map((post) => {
      const ageHours = Math.max(0, (now - new Date(post.createdAt).getTime()) / 3_600_000);
      const recency = 1 / (1 + ageHours / 24);
      const engagement = (post.likeCount + post.commentCount * 2) / maxEngagement;
      const quality = (post.avgRating - 3) / 2;
      let score = 0.5 * recency + 0.3 * engagement + 0.2 * quality;
      if (post.avgRating >= 4 && post.ratingCount >= 5) score *= 1.5;
      return { post, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.post);
}

async function loadRankedFeed(supabase: Client, userId: string, vibesOnly: boolean) {
  const { data: interests } = await supabase
    .from("interests")
    .select("post_id,state")
    .eq("user_id", userId);
  const excluded = new Set(
    (interests ?? []).filter((i) => i.state === "not_interested").map((i) => i.post_id),
  );

  let query = supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(120);
  if (vibesOnly) query = query.eq("is_vibe", true).eq("media_type", "video");

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []).filter((r) => !excluded.has(r.id as string));
  const decorated = await decorate(supabase, userId, rows as Array<Record<string, unknown>>);
  return rank(decorated.filter((p) => !(p.myRating !== null && p.myRating <= 2)));
}

export function getFeedFor(supabase: Client, userId: string) {
  return loadRankedFeed(supabase, userId, false);
}

export function getVibesFor(supabase: Client, userId: string) {
  return loadRankedFeed(supabase, userId, true);
}

export async function insertPost(
  supabase: Client,
  userId: string,
  input: { mediaPath: string; mediaType: "image" | "video"; caption: string; isVibe: boolean },
) {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      media_url: input.mediaPath,
      media_type: input.mediaType,
      caption: input.caption || null,
      is_vibe: input.isVibe,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function toggleLikeFor(supabase: Client, userId: string, postId: string) {
  const { data } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  if (data) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { liked: false };
  }
  const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: userId });
  if (error) throw new Error(error.message);
  return { liked: true };
}

export async function toggleSaveFor(supabase: Client, userId: string, postId: string) {
  const { data } = await supabase
    .from("saves")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  if (data) {
    const { error } = await supabase
      .from("saves")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { saved: false };
  }
  const { error } = await supabase.from("saves").insert({ post_id: postId, user_id: userId });
  if (error) throw new Error(error.message);
  return { saved: true };
}

export async function listComments(supabase: Client, postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("id,user_id,body,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const authorIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = authorIds.length
    ? await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", authorIds)
    : { data: [] };
  const map = new Map((profiles ?? []).map((p) => [p.id, toAuthor(p)] as const));
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.created_at,
    author:
      map.get(r.user_id) ??
      ({ id: r.user_id, username: "unknown", displayName: null, avatarUrl: null } as Author),
  }));
}

export async function insertComment(
  supabase: Client,
  userId: string,
  postId: string,
  body: string,
) {
  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, user_id: userId, body });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function upsertRating(
  supabase: Client,
  userId: string,
  postId: string,
  stars: number,
) {
  const { error } = await supabase
    .from("ratings")
    .upsert({ post_id: postId, user_id: userId, stars }, { onConflict: "post_id,user_id" });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function upsertInterest(
  supabase: Client,
  userId: string,
  postId: string,
  state: "interested" | "not_interested",
) {
  const { error } = await supabase
    .from("interests")
    .upsert({ post_id: postId, user_id: userId, state }, { onConflict: "user_id,post_id" });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function insertReport(
  supabase: Client,
  userId: string,
  postId: string,
  reason: string,
) {
  const { error } = await supabase
    .from("reports")
    .upsert({ post_id: postId, user_id: userId, reason }, { onConflict: "post_id,user_id" });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function toggleFollowFor(supabase: Client, userId: string, targetId: string) {
  if (targetId === userId) throw new Error("You cannot follow yourself");
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", userId)
    .eq("following_id", targetId)
    .maybeSingle();
  if (data) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", userId)
      .eq("following_id", targetId);
    if (error) throw new Error(error.message);
    return { following: false };
  }
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: userId, following_id: targetId });
  if (error) throw new Error(error.message);
  return { following: true };
}

export async function loadProfile(supabase: Client, userId: string, targetId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,avatar_url")
    .eq("id", targetId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile) throw new Error("Profile not found");

  const [posts, followers, following, isFollowing] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", targetId),
    supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", targetId),
    supabase
      .from("follows")
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", targetId),
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", userId)
      .eq("following_id", targetId)
      .maybeSingle(),
  ]);

  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    isSelf: targetId === userId,
    following: Boolean(isFollowing.data),
    counts: {
      posts: posts.count ?? 0,
      followers: followers.count ?? 0,
      following: following.count ?? 0,
    },
  };
}

export async function loadUserPosts(supabase: Client, userId: string, targetId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("user_id", targetId)
    .order("created_at", { ascending: false })
    .limit(120);
  if (error) throw new Error(error.message);
  return decorate(supabase, userId, (data ?? []) as Array<Record<string, unknown>>);
}

export async function loadSavedPosts(supabase: Client, userId: string) {
  const { data: saved } = await supabase.from("saves").select("post_id").eq("user_id", userId);
  const ids = (saved ?? []).map((s) => s.post_id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .in("id", ids)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return decorate(supabase, userId, (data ?? []) as Array<Record<string, unknown>>);
}

export async function updateOwnProfile(
  supabase: Client,
  userId: string,
  input: { username: string; displayName: string; bio: string; avatarUrl: string | null },
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      username: input.username,
      display_name: input.displayName || null,
      bio: input.bio || null,
      ...(input.avatarUrl ? { avatar_url: input.avatarUrl } : {}),
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}
