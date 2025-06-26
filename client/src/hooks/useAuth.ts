import { useState, useEffect } from "react";
import type { User } from "@shared/schema";

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    if (user?.id) {
      try {
        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
          const userData = await response.json();
          updateUser(userData);
          return userData;
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
    return null;
  };

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return { user, login, updateUser, refreshUser, logout };
}