import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';
import { ensureUuid } from '@/lib/utils/uuid-helper';
import { ActivityType } from '@/lib/utils/activity-types';

interface FixResult {
  fixed: boolean;
  count: number;
  error?: string;
  message?: string;
}

interface FixResults {
  [key: string]: FixResult;
}

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

    // Map between your activity-types.ts enum values and what's used in check/route.ts
    const typeMap = {
      [ActivityType.AUDIO_UPLOADED]: 'audio_uploaded',
      [ActivityType.DOCUMENT_UPLOADED]: 'document_uploaded',
      [ActivityType.TEXT_SUMMARIZED]: 'text_summarized',
      [ActivityType.QUESTION_ASKED]: 'question_asked'
    };

    // Get actual activity types in the database
    const { data: sampleActivities } = await supabase
      .from('user_activities')
      .select('activity_type')
      .eq('user_id', userId)
      .limit(20);

    const fixResults: FixResults = {};

    // For each activity type, check if we need to fix it
    for (const [enumType, expectedType] of Object.entries(typeMap)) {
      // Check if we have activities of the current type
      const activitiesOfType = sampleActivities?.filter(a =>
        a.activity_type === enumType || a.activity_type === expectedType
      );

      if (activitiesOfType?.length) {
        // Check if they need to be normalized
        const needFix = activitiesOfType.some(a => a.activity_type !== expectedType);

        if (needFix) {
          // Update activity types to match what's expected by the badge checker
          const { error } = await supabase
            .from('user_activities')
            .update({ activity_type: expectedType })
            .eq('user_id', userId)
            .eq('activity_type', enumType);

          fixResults[enumType] = {
            fixed: !error,
            count: activitiesOfType.length,
            error: error?.message
          };
        } else {
          fixResults[enumType] = { fixed: false, count: activitiesOfType.length, message: 'No fix needed' };
        }
      } else {
        fixResults[enumType] = { fixed: false, count: 0, message: 'No activities of this type' };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Activity types checked and fixed if needed',
      details: fixResults
    });
  } catch (error) {
    console.error('Error fixing activity types:', error);
    return NextResponse.json(
      { error: 'Error fixing activity types' },
      { status: 500 }
    );
  }
}