"use client"

import { useState, useEffect } from 'react';
import { UserActivity } from '@/lib/user-activity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Award, AlertCircle, Check, Database, Wrench, Plus } from 'lucide-react';

export default function BadgeDebugPage() {
  const [result, setResult] = useState<string>('');
  const [badgesResult, setBadgesResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBadgeChecking, setIsBadgeChecking] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>('');

  // Get user ID when component mounts
  useEffect(() => {
    const id = localStorage.getItem('user_id');
    if (id) setUserId(id);
  }, []);

  const simulateActivity = async (type: string, count: number = 1) => {
    setIsLoading(true);
    setResult(`Running ${count}× ${type} activity...`);

    try {
      const results = [];

      for (let i = 0; i < count; i++) {
        let response;

        switch (type) {
          case 'login':
            response = await UserActivity.login();
            break;
          case 'text':
            response = await UserActivity.summarizeText(1500);
            break;
          case 'audio':
            response = await UserActivity.uploadAudio(`lecture_${i}.mp3`, 120);
            break;
          case 'document':
            response = await UserActivity.uploadDocument(`assignment_${i}.pdf`, 5);
            break;
          case 'question':
            response = await UserActivity.askQuestion(`Question ${i}: What is the meaning of life?`);
            break;
          case 'assignment':
            response = await UserActivity.completeAssignment(`assignment_${i}`, 95);
            break;
        }

        results.push(response);

        // Small delay to prevent rate limiting
        if (i < count - 1) {
          await new Promise(r => setTimeout(r, 300));
        }
      }

      setResult(`${count}× ${type} activities logged.\nResponses: ${JSON.stringify(results[results.length-1], null, 2)}`);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBadges = async () => {
    setIsBadgeChecking(true);
    setBadgesResult('Checking badges...');

    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setBadgesResult('Error: No user ID found in localStorage');
        return;
      }

      // Call the badge check endpoint
      const checkResponse = await fetch('/api/badges/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!checkResponse.ok) {
        throw new Error(`Badge check failed: ${checkResponse.status}`);
      }

      const checkData = await checkResponse.json();

      // Then fetch all badges to see what the user has
      const badgesResponse = await fetch(`/api/badges?userId=${userId}&showAll=true`);

      if (!badgesResponse.ok) {
        throw new Error(`Failed to fetch badges: ${badgesResponse.status}`);
      }

      const badgesData = await badgesResponse.json();

      setBadgesResult(
        `Badge check results:\n${JSON.stringify(checkData, null, 2)}\n\n` +
        `User badges (${badgesData.length}):\n${JSON.stringify(badgesData.slice(0, 5), null, 2)}` +
        (badgesData.length > 5 ? '\n...and more' : '')
      );
    } catch (error) {
      setBadgesResult(`Error checking badges: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsBadgeChecking(false);
    }
  };

  const checkActivityCounts = async () => {
    setBadgesResult('Checking activity counts...');
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setBadgesResult('Error: No user ID found in localStorage');
        return;
      }

      const response = await fetch(`/api/badge-debug/counts?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch activity counts: ${response.status}`);
      }

      const data = await response.json();
      setBadgesResult(`Activity counts for user ${userId}:\n${JSON.stringify(data.activityCounts, null, 2)}\n\nTotal activities: ${data.totalActivities}`);
    } catch (error) {
      setBadgesResult(`Error checking activity counts: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const fixActivityTypes = async () => {
    setBadgesResult('Fixing activity types...');
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setBadgesResult('Error: No user ID found in localStorage');
        return;
      }

      const response = await fetch('/api/badges/fix-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fix activity types: ${response.status}`);
      }

      const data = await response.json();
      setBadgesResult(`Activity types fixed:\n${JSON.stringify(data, null, 2)}`);

      // After fixing, check badges again
      await checkBadges();
    } catch (error) {
      setBadgesResult(`Error fixing activity types: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const forceCreateBadge = async () => {
    setBadgesResult('Force creating First Step badge...');
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setBadgesResult('Error: No user ID found in localStorage');
        return;
      }

      const response = await fetch('/api/badges/force-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          badgeName: 'First Step'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to force create badge: ${response.status}`);
      }

      const data = await response.json();
      setBadgesResult(`Badge force created:\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setBadgesResult(`Error force creating badge: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            Badge System Debugging
          </CardTitle>
          <CardDescription>
            Test your badge system by simulating user activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Current User ID</AlertTitle>
            <AlertDescription>
              {userId ? (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <code className="bg-gray-100 dark:bg-gray-800 p-1 rounded">{userId}</code>
                </div>
              ) : (
                <span className="text-red-500">Not logged in! Please log in first.</span>
              )}
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Login Badges</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => simulateActivity('login')} disabled={isLoading || !userId}>
                  Log Single Login
                </Button>
                <Button onClick={() => simulateActivity('login', 5)} disabled={isLoading || !userId} variant="secondary">
                  Log 5× Logins
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Document & Text Badges</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => simulateActivity('document', 1)} disabled={isLoading || !userId}>
                  Log 1× Document
                </Button>
                <Button onClick={() => simulateActivity('document', 10)} disabled={isLoading || !userId} variant="secondary">
                  Log 10× Documents
                </Button>
                <Button onClick={() => simulateActivity('text', 1)} disabled={isLoading || !userId}>
                  Log 1× Text Summary
                </Button>
                <Button onClick={() => simulateActivity('text', 10)} disabled={isLoading || !userId} variant="secondary">
                  Log 10× Text Summaries
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Audio & Question Badges</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => simulateActivity('audio', 1)} disabled={isLoading || !userId}>
                  Log 1× Audio
                </Button>
                <Button onClick={() => simulateActivity('audio', 5)} disabled={isLoading || !userId} variant="secondary">
                  Log 5× Audio Files
                </Button>
                <Button onClick={() => simulateActivity('question', 1)} disabled={isLoading || !userId}>
                  Log 1× Question
                </Button>
                <Button onClick={() => simulateActivity('question', 20)} disabled={isLoading || !userId} variant="secondary">
                  Log 20× Questions
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-3">Advanced Debugging</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={checkActivityCounts}
                  disabled={!userId}
                  variant="outline"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Check Activity Counts
                </Button>

                <Button
                  onClick={fixActivityTypes}
                  disabled={!userId}
                  variant="outline"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Fix Activity Types
                </Button>

                <Button
                  onClick={forceCreateBadge}
                  variant="outline"
                  className="bg-green-500 hover:bg-green-600 text-white"
                  disabled={!userId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Force Create Test Badge
                  <Button
                      onClick={async () => {
                        setBadgesResult('Fixing badge constraints and testing...');
                        try {
                          const userId = localStorage.getItem('user_id');
                          if (!userId) {
                            setBadgesResult('Error: No user ID found in localStorage');
                            return;
                          }

                          const response = await fetch('/api/badges/fix-constraints', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ userId }),
                          });

                          if (!response.ok) {
                            throw new Error(`Failed to fix constraints: ${response.status}`);
                          }

                          const data = await response.json();
                          setBadgesResult(`Badge constraint fix results:\n${JSON.stringify(data, null, 2)}`);

                          // If successful, check badges again
                          if (data.success) {
                            await checkBadges();
                          }
                        } catch (error) {
                          setBadgesResult(`Error fixing constraints: ${error instanceof Error ? error.message : String(error)}`);
                        }
                      }}
                      variant="destructive"
                      className="w-full my-4"
                  >
                    🛠️ Fix Badge Constraints and Test
                  </Button>
                </Button>
                // Add this button to your badge-debug/page.tsx in the Advanced Debugging section
                <Button
                  onClick={async () => {
                    setBadgesResult('Checking available badges...');
                    try {
                      const response = await fetch('/api/badges/list-db');

                      if (!response.ok) {
                        throw new Error(`Failed to fetch badges: ${response.status}`);
                      }

                      const data = await response.json();
                      setBadgesResult(`Available badges in database (${data.count}):\n${JSON.stringify(data.badges, null, 2)}`);
                    } catch (error) {
                      setBadgesResult(`Error checking badges: ${error instanceof Error ? error.message : String(error)}`);
                    }
                  }}
                  variant="outline"
                >
                  List Available Badges
                </Button>
                // Add this to your badge-debug/page.tsx
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <Alert variant="default" className="mb-4">
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              After logging activities, click "Check Badges Now" to force badge evaluation.
            </AlertDescription>
          </Alert>

          <div className="mt-4">
            <Button
              onClick={checkBadges}
              disabled={isBadgeChecking || !userId}
              variant="default"
              className="w-full bg-amber-500 hover:bg-amber-600"
            >
              {isBadgeChecking ? 'Checking...' : 'Check Badges Now'}
            </Button>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md min-h-[100px] mt-4">
            <h3 className="font-medium mb-2">Activity Result:</h3>
            <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-[200px]">{result}</pre>
          </div>

          <Separator className="my-4" />

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md min-h-[100px]">
            <h3 className="font-medium mb-2">Badge Check Result:</h3>
            <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-[300px]">{badgesResult}</pre>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <p className="text-sm text-gray-500">
            All activities will be logged for user ID: {userId || 'Not logged in'}
          </p>
          <Button
            onClick={() => {
              setBadgesResult('');
              setResult('');
            }}
            variant="outline"
            size="sm"
          >
            Clear Results
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}