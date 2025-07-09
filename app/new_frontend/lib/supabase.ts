import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if we have the required environment variables
if (!supabaseUrl) console.warn('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!supabaseAnonKey) console.warn('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Create the default (anon) Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
})

// Safely access the service role key (only on the server)
const isServer = typeof window === 'undefined'
const supabaseServiceKey = isServer ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined

// Create admin client only on server
export const supabaseAdmin = isServer && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null
// Only create the admin client on the server
export const supabaseAdmin =
  typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null

// Helper to return the appropriate client
export async function supabaseServerClient() {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not initialized - using regular client instead')
    return supabase
  }
  return supabaseAdmin
}
