
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface User {
  uid: string; // Added UID
  email: string;
  fullName?: string; // Added fullName
}

// Simulate a simple in-memory store for registered users
interface RegisteredUser extends User {
  password?: string; 
}
let simulatedUserDatabase: RegisteredUser[] = [];

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string, redirectPath?: string) => void;
  logout: () => void;
  signup: (fullName: string, email: string, password?: string, redirectPath?: string) => void; // Added fullName
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedAuth = localStorage.getItem('isAuthenticated');
      const storedUser = localStorage.getItem('user');
      if (storedAuth === 'true' && storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser && parsedUser.uid && parsedUser.email) { // Validate stored user
            setIsAuthenticated(true);
            setUser(parsedUser);
        } else {
            // Clear invalid stored data
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error("Error reading auth state from localStorage:", error);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password?: string, redirectPath: string = '/') => {
    const foundUser = simulatedUserDatabase.find(
      (u) => u.email === email && (password ? u.password === password : true)
    );

    if (foundUser) {
      // Ensure uid and fullName are correctly set from foundUser
      const loggedInUser: User = { 
        uid: foundUser.uid, 
        email: foundUser.email,
        fullName: foundUser.fullName 
      };
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
      } else if (redirectPath) {
        router.push(redirectPath);
      } else {
        router.push('/');
      }
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again or sign up.",
        variant: "destructive",
      });
    }
  };

  const signup = (fullName: string, email: string, password?: string, redirectPath: string = '/') => {
    if (simulatedUserDatabase.find((u) => u.email === email)) {
      toast({
        title: "Signup Failed",
        description: "An account with this email already exists. Please log in.",
        variant: "destructive",
      });
      return;
    }

    // Simulate UID generation (replace with actual Firebase Auth UID in a real app)
    const uid = email.replace(/[^a-zA-Z0-9]/g, "") + Date.now(); 

    const newUser: RegisteredUser = { uid, email, fullName, password };
    simulatedUserDatabase.push(newUser);
    console.log("SIMULATION: User signed up and added to simulated DB:", newUser);
    
    // Auto-login after signup
    login(email, password, redirectPath); 
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
