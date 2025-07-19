import { NextRequest, NextResponse } from 'next/server';
  import { ensureUuid } from '@/lib/utils/uuid-helper';
  import { trackActivity } from '@/lib/activity-logger';

  export async function POST(request: NextRequest) {
    try {
      const data = await request.json();
      const { userId: rawUserId, activityType, metadata } = data;

      // Validate required fields
      if (!rawUserId || !activityType) {
        console.error('Missing required fields:', { rawUserId, activityType });
        return NextResponse.json(
          { error: 'Missing required fields: userId and activityType' },
          { status: 400 }
        );
      }

      // Convert userId to valid UUID format
      const userId = await ensureUuid(rawUserId);
      console.log(`Logging activity for user ${userId}: ${activityType}`, metadata);

      // Track the activity in the database
      const success = await trackActivity(userId, activityType, metadata);

      if (!success) {
        console.error('Activity tracking failed');
        return NextResponse.json(
          { error: 'Failed to track activity' },
          { status: 500 }
        );
      }

      // After activity is tracked, trigger badge check in background
      try {
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = request.headers.get('host') || 'localhost:3000';
        const badgeCheckUrl = `${protocol}://${host}/api/badges/check`;

        const token = request.headers.get('Authorization')?.replace('Bearer ', ''); // Extract token from request headers
        const headers = {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }), // Include token if available
        };
        const badgeResponse = await fetch(badgeCheckUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ userId }),
        });

        let newBadges = [];
        if (badgeResponse.ok) {
          const badgeData = await badgeResponse.json();
          newBadges = badgeData.newBadges || []; // Adjust based on your badge check API response
        } else {
          console.warn('Background badge check returned non-OK status:', badgeResponse.status);
        }
      } catch (error) {
        console.error('Background badge check failed:', error);
      }

      return NextResponse.json({
        success: true,
        message: 'Activity logged successfully',
        userId,
        activityType,
        metadata,
        newBadges: [] // Populate this if badge check returns new badges
      });

    } catch (error) {
      console.error('Error logging activity:', error);
      return NextResponse.json(
        { error: 'Failed to log activity' },
        { status: 500 }
      );
    }
  }