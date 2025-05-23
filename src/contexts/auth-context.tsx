
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface User {
  email: string;
  // Add other user properties as needed, e.g., name, id
}

// Simulate a simple in-memory store for registered users
interface RegisteredUser extends User {
  password?: string; // Store password for simulation - DO NOT DO THIS IN PRODUCTION
}
let simulatedUserDatabase: RegisteredUser[] = [];

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string, redirectPath?: string) => void;
  logout: () => void;
  signup: (email: string, password?: string, redirectPath?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('isAuthenticated');
      const storedUser = localStorage.getItem('user');
      if (storedAuth === 'true' && storedUser) {
        setIsAuthenticated(true);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error reading auth state from localStorage:", error);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password?: string, redirectPath: string = '/') => {
    // Find user in our simulated database
    const foundUser = simulatedUserDatabase.find(
      (u) => u.email === email && (password ? u.password === password : true) // Allow login without password if not provided (e.g., post-signup)
    );

    if (foundUser) {
      const loggedInUser: User = { email: foundUser.email };
      setIsAuthenticated(true);
      setUser(loggedInUser);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      console.log("SIMULATION: User logged in:", loggedInUser);
      toast({
        title: "Login Successful!",
        description: "Welcome back to QuantumFusion Solutions.",
      });

      const actionAfterLogin = localStorage.getItem('actionAfterLogin');
      localStorage.removeItem('actionAfterLogin');

      if (actionAfterLogin === 'applyJobModalOpen') {
        router.push('/careers');
      } else {
        router.push(redirectPath);
      }
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again or sign up.",
        variant: "destructive",
      });
    }
  };

  const signup = (email: string, password?: string, redirectPath: string = '/') => {
    // Check if user already exists in our simulated database
    if (simulatedUserDatabase.find((u) => u.email === email)) {
      toast({
        title: "Signup Failed",
        description: "An account with this email already exists. Please log in.",
        variant: "destructive",
      });
      return;
    }

    // Add new user to simulated database
    const newUser: RegisteredUser = { email, password };
    simulatedUserDatabase.push(newUser);
    console.log("SIMULATION: User signed up and added to simulated DB:", newUser);
    
    // Auto-login after signup
    login(email, password, redirectPath); 
    // The toast for successful signup is handled by the signup page itself or the login function now
    console.log("SIMULATION: Signup confirmation email sent to:", email);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('actionAfterLogin');
    console.log("SIMULATION: User logged out");
    toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
    });
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
