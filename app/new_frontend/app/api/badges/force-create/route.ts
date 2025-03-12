import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';
import { ensureUuid } from '@/lib/utils/uuid-helper';

export async function POST(request: NextRequest) {
  try {
    const { userId: rawUserId, badgeName = 'First Step' } = await request.json();

    if (!rawUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userId = await ensureUuid(rawUserId);
    console.log(`Force creating badge "${badgeName}" for user ${userId}`);
    const supabase = await supabaseServerClient();

    // First check if badge exists
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .select('id, name, description')
      .eq('name', badgeName)
      .single();

    if (badgeError) {
      console.error(`Badge "${badgeName}" not found:`, badgeError);

      // If badge doesn't exist, create it
      if (badgeError.code === 'PGRST116') { // Record not found
        console.log(`Creating badge "${badgeName}" in database`);
        const { data: newBadge, error: createError } = await supabase
          .from('badges')
          .insert({
            name: badgeName,
            description: `The ${badgeName} badge`,
            image_url: '/placeholder-badge.png'
          })
          .select()
          .single();

        if (createError) {
          console.error(`Failed to create badge "${badgeName}":`, createError);
          return NextResponse.json(
            { error: `Failed to create badge: ${createError.message}` },
            { status: 500 }
          );
        }

        console.log(`Badge created successfully:`, newBadge);
        badge = newBadge;
      } else {
        return NextResponse.json(
          { error: `Badge query error: ${badgeError.message}` },
          { status: 500 }
        );
      }
    }

    if (!badge) {
      return NextResponse.json(
        { error: `Badge "${badgeName}" not found and could not be created` },
        { status: 404 }
      );
    }

    console.log(`Found badge ${badge.id} "${badge.name}", attempting to award to user ${userId}`);

    // Check if user badge already exists
    const { data: existingBadge, error: existingError } = await supabase
      .from('user_badges')
      .select('id, is_earned')
      .eq('user_id', userId)
      .eq('badge_id', badge.id)
      .single();

    let result;
    const now = new Date().toISOString();

    if (existingError && existingError.code === 'PGRST116') { // Record not found
      // Create new user badge
      console.log(`Creating new user badge entry`);
      result = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id,
          is_earned: true,
          progress: 100,
          earned_at: now,
          notification_shown: false
        });
    } else if (!existingError) {
      // Update existing badge
      console.log(`Updating existing user badge entry ${existingBadge.id}`);
      result = await supabase
        .from('user_badges')
        .update({
          is_earned: true,
          progress: 100,
          earned_at: now,
          notification_shown: false
        })
        .eq('id', existingBadge.id);
    } else {
      console.error(`Error checking existing user badge:`, existingError);
      return NextResponse.json(
        { error: `Database error: ${existingError.message}` },
        { status: 500 }
      );
    }

    if (result.error) {
      console.error(`Error saving user badge:`, result.error);
      return NextResponse.json(
        { error: `Failed to save badge: ${result.error.message}` },
        { status: 500 }
      );
    }

    console.log(`Badge "${badgeName}" successfully awarded to user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Badge "${badgeName}" force-created for user ${userId}`,
      badge,
      operation: existingError ? 'created' : 'updated'
    });
  } catch (error) {
    console.error('Error in force-create badge endpoint:', error);
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}