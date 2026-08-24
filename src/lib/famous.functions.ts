import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getFeedFor,
  getVibesFor,
  insertComment,
  insertPost,
  insertReport,
  listComments,
  loadProfile,
  loadSavedPosts,
  loadUserPosts,
  toggleFollowFor,
  toggleLikeFor,
  toggleSaveFor,
  updateOwnProfile,
  upsertInterest,
  upsertRating,
} from "./famous.server";

const postIdSchema = z.object({ postId: z.string().uuid() });

export const getFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getFeedFor(context.supabase, context.userId));

export const getVibes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getVibesFor(context.supabase, context.userId));

export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        mediaPath: z.string().min(1),
        mediaType: z.enum(["image", "video"]),
        caption: z.string().max(2200).default(""),
        isVibe: z.boolean().default(false),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => insertPost(context.supabase, context.userId, data));

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => postIdSchema.parse(data))
  .handler(async ({ data, context }) =>
    toggleLikeFor(context.supabase, context.userId, data.postId),
  );

export const toggleSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => postIdSchema.parse(data))
  .handler(async ({ data, context }) =>
    toggleSaveFor(context.supabase, context.userId, data.postId),
  );

export const getComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => postIdSchema.parse(data))
  .handler(async ({ data, context }) => listComments(context.supabase, data.postId));

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ postId: z.string().uuid(), body: z.string().min(1).max(1000) }).parse(data),
  )
  .handler(async ({ data, context }) =>
    insertComment(context.supabase, context.userId, data.postId, data.body),
  );

export const ratePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ postId: z.string().uuid(), stars: z.number().int().min(1).max(5) }).parse(data),
  )
  .handler(async ({ data, context }) =>
    upsertRating(context.supabase, context.userId, data.postId, data.stars),
  );

export const setInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        postId: z.string().uuid(),
        state: z.enum(["interested", "not_interested"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) =>
    upsertInterest(context.supabase, context.userId, data.postId, data.state),
  );

export const reportPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ postId: z.string().uuid(), reason: z.string().max(300).default("Inappropriate") })
      .parse(data),
  )
  .handler(async ({ data, context }) =>
    insertReport(context.supabase, context.userId, data.postId, data.reason),
  );

export const followUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ targetId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) =>
    toggleFollowFor(context.supabase, context.userId, data.targetId),
  );

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid().optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) =>
    loadProfile(context.supabase, context.userId, data.userId ?? context.userId),
  );

export const getUserPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid().optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) =>
    loadUserPosts(context.supabase, context.userId, data.userId ?? context.userId),
  );

export const getSavedPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => loadSavedPosts(context.supabase, context.userId));

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        username: z
          .string()
          .min(3)
          .max(24)
          .regex(/^[a-z0-9._]+$/, "lowercase letters, numbers, dot and underscore only"),
        displayName: z.string().max(60).default(""),
        bio: z.string().max(300).default(""),
        avatarUrl: z.string().nullable().default(null),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => updateOwnProfile(context.supabase, context.userId, data));
