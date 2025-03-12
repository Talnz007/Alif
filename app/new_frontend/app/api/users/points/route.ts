import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureUuid } from '@/lib/utils/uuid-helper'; // Add this import


export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { userId: rawUserId, points, reason, metadata } = data;

    // Validate required fields
    if (!rawUserId || typeof points !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: userId and points' },
        { status: 400 }
      );
    }

    const userId = ensureUuid(rawUserId);

    // Insert points transaction
    const { error: insertError } = await supabase
      .from('user_points')
      .insert({
        user_id: userId, // Now using valid UUID
        points,
        reason,
        metadata,
        timestamp: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error recording points transaction:', insertError);
      throw insertError;
    }

    // Get current points from user
    const { data: userData, error: selectError } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', userId) // Now using valid UUID
      .single();

    if (selectError) {
      console.error('Error getting user points:', selectError);
      throw selectError;
    }

    const currentPoints = userData?.total_points || 0;
    const newTotal = currentPoints + points;

    // Update user's total points
    const { error: updateError } = await supabase
      .from('users')
      .update({ total_points: newTotal })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user points:', updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: `${points} points awarded successfully`,
      newTotal
    });

  } catch (error) {
    console.error('Error awarding points:', error);
    return NextResponse.json(
      { error: 'Failed to award points' },
      { status: 500 }
    );
  }
}