import { supabase } from './supabase';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    username?: string;
    email?: string;
    access_token?: string;
  };
}

export const AuthService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Convert credentials to form data format required by FastAPI
      const formData = new URLSearchParams();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.detail || 'Login failed',
        };
      }

      // Store the token in local storage
      localStorage.setItem('auth_token', data.access_token);

      return {
        success: true,
        message: 'Login successful',
        data
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred',
      };
    }
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.detail || 'Registration failed',
        };
      }

      // Store the token in local storage
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
      }

      return {
        success: true,
        message: 'Registration successful',
        data
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred',
      };
    }
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    // Can add additional cleanup here if needed
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
