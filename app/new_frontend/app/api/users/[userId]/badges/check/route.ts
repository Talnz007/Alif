import { NextRequest, NextResponse } from 'next/server';
import { ensureUuid, debugUuid } from '@/lib/utils/uuid-helper';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // Initialize with undefined to fix the "used before assigned" error
  let resolvedUserId: string | undefined;

  try {
    // First, await the params to get the raw userId
    const { userId: rawUserId } = await params;
    debugUuid(rawUserId);
    resolvedUserId = await ensureUuid(rawUserId);
    const userId = resolvedUserId; // For code clarity

    const { activityType, metadata } = await request.json();

    console.log('🎯 Checking badges for user:', userId, 'activity:', activityType);

    // Get auth token from request headers (if user is authenticated)
    const authHeader = request.headers.get('authorization');

    // REMOVE localStorage call - it doesn't exist on server
    let authToken = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    }

    // Try getting token from cookies
    if (!authToken) {
      const cookies = request.cookies;
      const tokenCookie = cookies.get('auth_token');
      if (tokenCookie) {
        authToken = tokenCookie.value;
      }
    }

    // Call your Python backend for badge checking
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth header if we have a token
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log('🔐 Adding auth token to Python backend request');
    } else {
      console.warn('⚠️ No auth token available for Python backend request');
    }

    const requestBody = {
      user_id: userId,
      activity_type: activityType,
      metadata: metadata || {}
    };

    console.log('📞 Calling Python backend:', {
      url: `${pythonBackendUrl}/api/v1/badges/check-all`,
      hasAuth: !!authToken,
      body: requestBody
    });

    const response = await fetch(`${pythonBackendUrl}/api/v1/badges/check-all`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Python backend error:', response.status, errorText);

      // If it's an auth error, still try to return a success response for now
      if (response.status === 401 || response.status === 403) {
        console.log('🔓 Auth issue with Python backend, falling back to Supabase check');
        return await fallbackBadgeCheck(userId);
      }

      throw new Error(`Python backend returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Python backend response:', result);

    return NextResponse.json({
      success: true,
      badgeCount: result.data?.length || 0,
      newBadges: result.data || []
    });

  } catch (error) {
    console.error('❌ Error checking badges:', error);

    // Use the resolved userId if available, otherwise return a clear error
    if (resolvedUserId) {
      return await fallbackBadgeCheck(resolvedUserId);
    } else {
      return NextResponse.json(
        { error: 'Invalid user ID or processing error' },
        { status: 400 }
      );
    }
  }
}

// Fallback function when Python backend is not available
async function fallbackBadgeCheck(userId: string) {
  try {
    const { supabase } = await import('@/lib/supabase');

    const { data, error } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('is_earned', true);

    if (error) {
      console.error('❌ Fallback badge check error:', error);
      return NextResponse.json(
        { error: 'Failed to check badges' },
        { status: 500 }
      );
    }

    const badgeCount = data?.length || 0;
    console.log('🔄 Fallback badge check - user has', badgeCount, 'badges');

    return NextResponse.json({
      success: true,
      badgeCount,
      newBadges: [],
      fallback: true
    });

  } catch (error) {
    console.error('❌ Fallback badge check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check badges' },
      { status: 500 }
    );
  }
}