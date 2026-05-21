-- ============================================================================
-- Krishi AI — Supabase Shared Reference Images Schema (READ-ONLY)
-- ============================================================================
-- All user data (scans, chat, profile, images) is stored locally in IndexedDB.
-- This schema is for the shared reference images table only.
-- Run once in your existing Supabase project to expose reference images.
-- ============================================================================

-- Reference images table — shared crop disease reference photos
create table if not exists public.reference_images (
  id          uuid default gen_random_uuid() primary key,
  crop        text not null,
  disease     text,
  image_url   text not null,
  label       text,
  source      text default 'BRRI/BARI/DAE',
  created_at  timestamptz default now()
);

create index if not exists idx_ref_crop on public.reference_images(crop);
create index if not exists idx_ref_disease on public.reference_images(disease);

-- Enable RLS
alter table public.reference_images enable row level security;

-- Allow public read (anon key can only SELECT)
create policy "Public read access for reference_images"
  on public.reference_images for select
  using (true);

-- ============================================================================
-- Storage bucket for shared reference images
-- ============================================================================
-- Create a 'shared-images' bucket (public read):
-- Dashboard → Storage → Create bucket → name: 'shared-images' → public
-- Then add policy: "Public Read" for select on storage.objects
