
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { mockUsers, User } from "@/lib/mockData";

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, username?: string, emoji?: string) => Promise<User>;
  signOut: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking local storage for a saved session
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse saved user:", error);
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API authentication delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Find user by email (in a real app, would verify password too)
    const existingUser = mockUsers.find(u => u.email === email);
    
    if (!existingUser) {
      setIsLoading(false);
      throw new Error("Invalid email or password");
    }
    
    // Save user to state and local storage
    setUser(existingUser);
    localStorage.setItem("user", JSON.stringify(existingUser));
    
    setIsLoading(false);
    return existingUser;
  };

  const signUp = async (email: string, password: string, username?: string, emoji?: string) => {
    setIsLoading(true);
    
    // Simulate API authentication delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    
    if (existingUser) {
      setIsLoading(false);
      throw new Error("Email already in use");
    }
    
    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name: username || email.split('@')[0],
      emoji: emoji || "😀" // Default emoji
    };
    
    // Save user to state and local storage
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    
    setIsLoading(false);
    return newUser;
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signUp,
        signOut,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
