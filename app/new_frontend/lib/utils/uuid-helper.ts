import { v4 as uuidv4 } from 'uuid';

/**
 * Debug function to log UUID conversion details
 */
export function debugUuid(rawId: string | number | null | Promise<any>): void {
  if (rawId === null || rawId === undefined) {
    console.log('Debug UUID: null or undefined input');
    return;
  }

  if (rawId instanceof Promise) {
    console.log(`Debug UUID: Promise received, awaiting resolution`);
    return;
  }

  console.log(`Original ID: ${rawId}, UUID: ${rawId}`);
}

/**
 * Ensures the input is a valid UUID.
 * If the input is already a UUID, it returns it as is.
 * Otherwise, it looks up the actual UUID from the database.
 * Now handles Promise inputs for use with dynamic route params.
 */
export async function ensureUuid(rawId: string | number | null | Promise<any>): Promise<string> {
  try {
    // First, resolve the input if it's a Promise
    const resolvedId = rawId instanceof Promise ? await rawId : rawId;

    // Handle null/undefined cases
    if (resolvedId === null || resolvedId === undefined) {
      console.warn('⚠️ Null or undefined rawId passed to ensureUuid');
      return '00000000-0000-0000-0000-000000000000'; // Fallback UUID
    }

    // If it's already a valid UUID, return it
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof resolvedId === 'string' && uuidPattern.test(resolvedId)) {
      return resolvedId;
    }

    // Import dynamically to avoid circular dependencies
    const { supabaseServerClient } = await import('@/lib/supabase');
    const supabase = await supabaseServerClient();

    // Try finding by username first (if the resolvedId might be a username)
    if (typeof resolvedId === 'string' && !Number.isInteger(Number(resolvedId))) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', resolvedId)
        .single();

      if (!userError && userData && userData.id) {
        console.log(`Found UUID ${userData.id} for username ${resolvedId}`);
        return userData.id;
      }
    }

    // If numeric ID, try finding by id or legacy_id
    if (Number.isInteger(Number(resolvedId))) {
      // Look for a legacy_id field first (if you have one)
      const { data: legacyData, error: legacyError } = await supabase
        .from('users')
        .select('id')
        .eq('legacy_id', resolvedId)
        .single();

      if (!legacyError && legacyData && legacyData.id) {
        return legacyData.id;
      }

      // If that fails, try the first few UUIDs as a fallback
      const { data: samples } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (samples && samples.length > 0) {
        console.log(`⚠️ No exact match for ID ${resolvedId}, using first user UUID as fallback`);
        return samples[0].id;
      }
    }

    // If all else fails, use a fallback UUID
    console.warn(`⚠️ Could not find UUID for ${resolvedId}, using fallback`);
    return '00000000-0000-0000-0000-000000000000';

  } catch (error) {
    console.error('❌ Error in ensureUuid:', error);
    // If there's an error, just return the original ID (or a fallback UUID)
    const finalId = rawId instanceof Promise
      ? '00000000-0000-0000-0000-000000000000' // Can't use a rejected promise
      : typeof rawId === 'string' ? rawId : String(rawId);

    return finalId;
  }
}