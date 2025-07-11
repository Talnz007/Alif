import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl) console.warn('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!supabaseAnonKey) console.warn('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Default anon client (for public/unauthenticated use)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true },
})

// Helper: Create a client that always sends the given JWT as Authorization header
export function getSupabaseClient(token?: string): SupabaseClient {
  // If no token, return anon client
  if (!token) return supabase
  // Create a new client instance with the Authorization header set
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` }
    },
    auth: { persistSession: false }
  })
}

// Service role (admin) client, only on the server
const isServer = typeof window === 'undefined'
const supabaseServiceKey = isServer ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined
export const supabaseAdmin = isServer && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function supabaseServerClient() {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not initialized - using regular client instead')
    return supabase
  }
  return supabaseAdmin
}