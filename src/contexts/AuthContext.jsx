import React, { createContext, useContext, useState, useEffect } from "react";
import { authUtils } from "../utils/auth";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState(null);

  // Check authentication status on mount and when auth state changes
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const user = authUtils.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setIsAuthenticated(true);
          setSessionExpiry(authUtils.getSessionExpiry());
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
          setSessionExpiry(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setCurrentUser(null);
        setIsAuthenticated(false);
        setSessionExpiry(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    // Set up interval to check auth status every minute
    const interval = setInterval(checkAuthStatus, 60000);

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === "auth_user" || e.key === null) {
        checkAuthStatus();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const login = (userData) => {
    try {
      authUtils.login(userData);
      setCurrentUser(userData);
      setIsAuthenticated(true);
      setSessionExpiry(authUtils.getSessionExpiry());
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    try {
      authUtils.logout();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setSessionExpiry(null);
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  };

  const extendSession = () => {
    try {
      authUtils.extendSession();
      setSessionExpiry(authUtils.getSessionExpiry());
      return true;
    } catch (error) {
      console.error("Session extension error:", error);
      return false;
    }
  };

  const hasPermission = (permissions) => {
    if (!currentUser || !permissions) return false;
    return authUtils.hasPermission(permissions);
  };

  const hasRole = (roles) => {
    if (!currentUser || !roles) return false;
    return authUtils.hasRole(roles);
  };

  const isSessionExpiringSoon = () => {
    return authUtils.isSessionExpiringSoon();
  };

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    sessionExpiry,
    login,
    logout,
    extendSession,
    hasPermission,
    hasRole,
    isSessionExpiringSoon,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

