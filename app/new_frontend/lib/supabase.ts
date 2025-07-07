import { createClient } from '@supabase/supabase-js'

// These environment variables should be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoa2J0ZnpydXFrY3lpd3Fna3VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjAxNzgyOSwiZXhwIjoyMDQ3NTkzODI5fQ.aAyvZi5fmuK9XX_vphWbho97m5Q8VnQTCqlh3fJJF_I'


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

// Create a service client for server-side operations only if the service key is available
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Helper for server-side operations with safety check
export async function supabaseServerClient() {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not initialized - using regular client instead')
    return supabase
  }
  return supabaseAdmin
}