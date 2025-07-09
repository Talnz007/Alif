import { createClient } from '@supabase/supabase-js'

// These environment variables should be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if we have the required environment variables
if (!supabaseUrl) console.warn('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!supabaseAnonKey) console.warn('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Create a Supabase client for client-side operations
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
    }
  }
)

// Only create the admin client on the server
export const supabaseAdmin =
  typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null

// Helper for server-side operations with safety check
export async function supabaseServerClient() {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not initialized - using regular client instead')
    return supabase
  }
  return supabaseAdmin
}
