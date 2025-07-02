// Helper to set an auth state cookie that middleware can detect
export function setAuthCookie(isAuthenticated: boolean) {
  if (isAuthenticated) {
    // Set a cookie for middleware to detect auth state
    document.cookie = "auth_state=true; path=/; max-age=604800; SameSite=Strict";
  } else {
    // Clear the cookie
    document.cookie = "auth_state=; path=/; max-age=0; SameSite=Strict";
  }
}
// Helper to get the current user's auth token
export async function getCurrentUserToken(): Promise<string | null> {
  try {
    // If you store JWT in cookies or localStorage
    const token = localStorage.getItem('access_token') ||
                 document.cookie
                   .split('; ')
                   .find(row => row.startsWith('access_token='))
                   ?.split('=')[1];

    return token || null;
  } catch (error) {
    console.error('Error getting user token:', error);
    return null;
  }
}

// Helper to get current user info
export async function getCurrentUser() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}