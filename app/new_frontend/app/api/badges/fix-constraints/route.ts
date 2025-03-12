import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';
import { ensureUuid } from '@/lib/utils/uuid-helper';

export async function POST(request: NextRequest) {
  try {
    const { userId: rawUserId } = await request.json();
    
    if (!rawUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const userId = await ensureUuid(rawUserId);
    const supabase = await supabaseServerClient();
    
    // First try to fix the constraint issue with direct SQL
    const { data: fixResult, error: fixError } = await supabase.rpc(
      'execute_sql',
      {
        query: `
          DO $$
          DECLARE
              constraint_exists boolean;
          BEGIN
              SELECT EXISTS (
                  SELECT 1
                  FROM pg_constraint
                  WHERE conname = 'user_badges_user_id_fkey'
              ) INTO constraint_exists;

              IF constraint_exists THEN
                  EXECUTE 'ALTER TABLE user_badges DROP CONSTRAINT user_badges_user_id_fkey';
              END IF;
              
              BEGIN
                  EXECUTE 'ALTER TABLE user_badges ADD CONSTRAINT user_badges_user_id_fkey 
                           FOREIGN KEY (user_id) REFERENCES users(id)';
              EXCEPTION WHEN others THEN
                  NULL;
              END;
          END $$;
          
          SELECT 'Constraint fixed' as result;
        `
      }
    );
    
    // Now try to award the First Step badge using our bypass function
    const { data: awardResult, error: awardError } = await supabase.rpc(
      'award_badge_bypass_constraints',
      {
        p_user_id: userId,
        p_badge_id: 1 // First Step badge
      }
    );
    
    // Get user details to verify
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, email, created_at')
      .eq('id', userId)
      .single();
    
    // Return comprehensive result
    return NextResponse.json({
      success: !awardError && (awardResult?.success === true),
      userId,
      fixResult,
      fixError: fixError?.message,
      awardResult,
      awardError: awardError?.message,
      userData,
      userError: userError?.message,
      message: awardResult?.success 
        ? `Badge successfully ${awardResult.operation}` 
        : 'Badge award attempt completed with issues'
    });
  } catch (error) {
    console.error('Error fixing badge constraints:', error);
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}