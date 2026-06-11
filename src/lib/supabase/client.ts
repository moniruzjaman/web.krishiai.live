import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing environment variables — client will not function')
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
