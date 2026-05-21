import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL || "";
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

let client: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (!url || !anon) return null;
  if (!client) client = createClient(url, anon, {
    auth: { persistSession: false },
  });
  return client;
}

export function isSupabaseReady(): boolean {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

// ── Read-only: fetch shared reference images from existing Supabase project ──

export interface SharedReferenceImage {
  id: string;
  crop?: string;
  disease?: string;
  image_url: string;
  label?: string;
  created_at?: string;
}

const REF_IMAGES_TABLE = "reference_images";

export async function getReferenceImages(
  crop?: string,
  disease?: string,
  limit = 20
): Promise<SharedReferenceImage[]> {
  const sb = getSupabase();
  if (!sb) return [];

  let query = sb.from(REF_IMAGES_TABLE).select("*").limit(limit);
  if (crop) query = query.eq("crop", crop);
  if (disease) query = query.eq("disease", disease);
  const { data } = await query;
  return (data ?? []) as SharedReferenceImage[];
}

export async function getReferenceImageUrl(path: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = sb.storage.from("shared-images").getPublicUrl(path);
  return data.publicUrl;
}
