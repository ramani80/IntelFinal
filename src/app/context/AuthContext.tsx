import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isEmailAuthorized } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      if (session?.user) {
        await updateUserState(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await updateUserState(session.user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserState(supabaseUser: SupabaseUser) {
    const userData = {
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email || '',
    };
    setUser(userData);
  }

  const signup = async (name: string, email: string, password: string) => {
    try {
      // Check if email is authorized
      if (!isEmailAuthorized(email)) {
        return {
          success: false,
          message: 'This email is not authorized to access the system. Only specific emails can sign up.',
        };
      }

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: window.location.origin + '/login',
        },
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        return {
          success: true,
          message: 'Signup successful! Please check your email to verify your account.',
        };
      }

      // If auto-confirmed, update user state
      if (data?.user) {
        await updateUserState(data.user);
      }

      return {
        success: true,
        message: 'Signup successful!',
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.message || 'An error occurred during signup.',
      };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Check if email is authorized
      if (!isEmailAuthorized(email)) {
        return {
          success: false,
          message: 'This email is not authorized to access the system.',
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return {
            success: false,
            message: 'Invalid email or password. Please try again.',
          };
        }
        if (error.message.includes('Email not confirmed')) {
          return {
            success: false,
            message: 'Please verify your email before logging in. Check your inbox for the verification link.',
          };
        }
        return {
          success: false,
          message: error.message,
        };
      }

      if (data?.user) {
        await updateUserState(data.user);
        return {
          success: true,
          message: 'Login successful!',
        };
      }

      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'An error occurred during login.',
      };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          name: updates.name || user.name,
        },
      });

      if (error) {
        console.error('Error updating user:', error);
        return;
      }

      // Update local state
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        updateUser,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
