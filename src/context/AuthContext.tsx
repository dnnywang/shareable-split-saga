
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  username: string;
  emoji: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, emoji: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on load
  useEffect(() => {
    const loadUserFromStorage = () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem('splitUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserFromStorage();
  }, []);

  // Mock authentication functions (will be replaced with Supabase)
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock auth - replace with Supabase
      // This will be replaced once Supabase is integrated
      const mockUser = {
        id: `user-${Date.now()}`,
        email,
        username: email.split('@')[0],
        emoji: '😎',
      };
      
      setUser(mockUser);
      localStorage.setItem('splitUser', JSON.stringify(mockUser));
      toast.success("Successfully signed in!");
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error("Failed to sign in");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string, emoji: string) => {
    setIsLoading(true);
    try {
      // Mock signup - replace with Supabase
      const mockUser = {
        id: `user-${Date.now()}`,
        email,
        username,
        emoji,
      };
      
      setUser(mockUser);
      localStorage.setItem('splitUser', JSON.stringify(mockUser));
      toast.success("Account created successfully!");
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error("Failed to create account");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Mock signout - replace with Supabase
      setUser(null);
      localStorage.removeItem('splitUser');
      toast.success("Successfully signed out");
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error("Failed to sign out");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      // Mock profile update - replace with Supabase
      if (user) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('splitUser', JSON.stringify(updatedUser));
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error("Failed to update profile");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
