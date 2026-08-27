import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type CacheEntry = { url: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const TTL_SECONDS = 60 * 60;

export async function getSignedUrl(bucket: string, path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const key = `${bucket}:${path}`;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.url;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  cache.set(key, { url: data.signedUrl, expiresAt: Date.now() + (TTL_SECONDS - 120) * 1000 });
  return data.signedUrl;
}

export function useSignedUrl(bucket: string, path: string | null) {
  const [url, setUrl] = useState<string | null>(() =>
    path && /^https?:\/\//.test(path) ? path : null,
  );

  useEffect(() => {
    let active = true;
    if (!path) {
      setUrl(null);
      return;
    }
    getSignedUrl(bucket, path).then((value) => {
      if (active) setUrl(value);
    });
    return () => {
      active = false;
    };
  }, [bucket, path]);

  return url;
}

export async function uploadToBucket(
  bucket: string,
  userId: string,
  file: File,
): Promise<{ path: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    ...(file.type ? { contentType: file.type } : {}),
  });

  if (error) throw new Error(error.message);
  return { path };
}
