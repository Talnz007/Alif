import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Looking up user by identifier: ${username}`);

    // Get Supabase client
    const supabase = await supabaseServerClient();

    // Try to find by username first
    let { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    // If no user found by username, try email
    if (error && error.code === 'PGRST116') {
      console.log(`No user found with username: ${username}, trying email lookup`);

      // Check if the identifier contains @ (likely an email)
      if (username.includes('@')) {
        ({ data, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', username)
          .single());
      } else {
        // Try with email domain appended
        const possibleEmail = `${username}@gmail.com`;
        console.log(`Trying possible email: ${possibleEmail}`);

        ({ data, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', possibleEmail)
          .single());
      }
    }

    if (error) {
      // If no user is found by either username or email
      if (error.code === 'PGRST116') {
        console.log(`No user found for identifier: ${username}`);

        // Fall back to getting any user (for testing only)
        const { data: firstUser } = await supabase
          .from('users')
          .select('id, username, email')
          .limit(1)
          .single();

        if (firstUser) {
          console.log(`Using first available user as fallback: ${firstUser.username} (${firstUser.id})`);
          return NextResponse.json({
            id: firstUser.id,
            message: 'Used fallback user - fix your auth flow'
          });
        }

        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      console.error('Error looking up user ID:', error);
      return NextResponse.json(
        { error: 'Failed to find user' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return the user ID
    return NextResponse.json({ id: data.id });

  } catch (error) {
    console.error('User lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}