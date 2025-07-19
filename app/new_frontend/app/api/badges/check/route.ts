import { NextRequest, NextResponse } from 'next/server';
import { ensureUuid, debugUuid } from '@/lib/utils/uuid-helper';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  let resolvedUserId: string | undefined;

  try {
    const rawUserId = params.userId; // Synchronous, no await
    debugUuid(rawUserId);
    resolvedUserId = await ensureUuid(rawUserId);
    const userId = resolvedUserId;

    const { activityType, metadata } = await request.json();
    console.log('🎯 Checking badges for user:', userId, 'activity:', activityType);

    let authToken: string | null = null;

    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
      console.log('🔑 Found auth token in Authorization header');
    }

    if (!authToken) {
      const cookieStore = await cookies();
      const possibleCookieNames = [
        'auth_token',
        'sb-access-token',
        'access_token',
        'token',
        `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/\/\/([^\.]+)/)?.[1]}-auth-token`,
      ];

      for (const cookieName of possibleCookieNames) {
        const cookie = cookieStore.get(cookieName);
        if (cookie?.value) {
          try {
            const parsedValue = JSON.parse(cookie.value);
            authToken = parsedValue.access_token || parsedValue.token || cookie.value;
          } catch {
            authToken = cookie.value;
          }
          console.log(`🍪 Found auth token in cookie: ${cookieName}`);
          break;
        }
      }
    }

    if (!authToken && metadata?.authToken) {
      authToken = metadata.authToken;
      console.log('📦 Found auth token in request metadata');
    }

    if (!authToken) {
      console.warn('⚠️ No auth token available for Python backend request');
    }

    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    else headers['X-User-ID'] = userId;

    const requestBody = { user_id: userId, activity_type: activityType, metadata: metadata || {} };
    console.log('📞 Calling Python backend:', { url: `${pythonBackendUrl}/api/v1/badges/check-all`, hasAuth: !!authToken, body: requestBody });

    const response = await fetch(`${pythonBackendUrl}/api/v1/badges/check-all`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Python backend error:', response.status, errorText);
      if (response.status === 401 || response.status === 403) {
        console.log('🔓 Auth issue with Python backend, falling back to Supabase check');
        return await fallbackBadgeCheck(userId);
      }
      throw new Error(`Python backend returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Python backend response:', result);

    return NextResponse.json({ success: true, badgeCount: result.data?.length || 0, newBadges: result.data || [] });
  } catch (error) {
    console.error('❌ Error checking badges:', error);
    if (resolvedUserId) return await fallbackBadgeCheck(resolvedUserId);
    return NextResponse.json({ error: 'Invalid user ID or processing error' }, { status: 400 });
  }
}

async function fallbackBadgeCheck(userId: string) {
  const { supabase } = await import('@/lib/supabase');
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('is_earned', true);

    if (error) {
      console.error('❌ Fallback badge check error:', error);
      return NextResponse.json({ error: 'Failed to check badges' }, { status: 500 });
    }

    const badgeCount = data?.length || 0;
    console.log('🔄 Fallback badge check - user has', badgeCount, 'badges');
    return NextResponse.json({ success: true, badgeCount, newBadges: [], fallback: true });
  } catch (error) {
    console.error('❌ Fallback badge check failed:', error);
    return NextResponse.json({ error: 'Failed to check badges' }, { status: 500 });
  }
}