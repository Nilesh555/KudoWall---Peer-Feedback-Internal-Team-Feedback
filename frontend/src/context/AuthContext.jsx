import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, getAccessToken, setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Current user state
  const [user, setUser] = useState(null);

  // Access token state (in-memory, with fallback getter)
  const [accessToken, setAccessTokenState] = useState(getAccessToken());

  // Authentication loading state
  const [loading, setLoading] = useState(true);

  /**
   * GetCurrentUser: Fetches the authenticated user's profile and updates context state.
   */
  const getCurrentUser = useCallback(async () => {
    try {
      const profile = await authService.getCurrentUser();
      setUser(profile);
      return profile;
    } catch (err) {
      setUser(null);
      throw err;
    }
  }, []);

  /**
   * RefreshToken: Uses the HTTP-only 7-day refresh cookie to obtain a new short-lived access token.
   */
  const refreshToken = useCallback(async () => {
    try {
      const data = await authService.refreshToken();
      const newToken = data?.access_token;
      if (newToken) {
        setAccessTokenState(newToken);
        return newToken;
      }
      return null;
    } catch (err) {
      setAccessTokenState(null);
      setAccessToken(null);
      setUser(null);
      throw err;
    }
  }, []);

  /**
   * Restore authentication on page refresh using the refresh-token API:
   * When the page is reloaded, the in-memory access token may be missing.
   * We proactively call refreshToken() to exchange the HTTP-only cookie for a fresh access token,
   * then fetch the current user's profile.
   */
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      setLoading(true);
      try {
        // Attempt to refresh the access token via the HTTP-only cookie
        await refreshToken();
        // With fresh access token active, retrieve current user
        if (isMounted) {
          await getCurrentUser();
        }
      } catch (err) {
        // No valid session or refresh cookie expired
        if (isMounted) {
          setUser(null);
          setAccessTokenState(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    // Listen for global auth:expired event emitted by Axios interceptor
    const handleAuthExpired = () => {
      if (isMounted) {
        setUser(null);
        setAccessTokenState(null);
        setAccessToken(null);
      }
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [refreshToken, getCurrentUser]);

  /**
   * Login: Authenticates user credentials, sets access token, and fetches current user.
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      const newToken = data.access_token;
      setAccessTokenState(newToken);
      // Immediately load current user profile
      const profile = await getCurrentUser();
      return profile;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Signup: Registers a new user.
   */
  const signup = async (formData) => {
    const data = await authService.signup(formData);
    return data;
  };

  /**
   * VerifyEmail: Verifies user email via simulated token.
   */
  const verifyEmail = async (email, verificationToken) => {
    const data = await authService.verifyEmail({ email, token: verificationToken });
    return data;
  };

  /**
   * Logout: Invalids backend session, clears HTTP-only cookie, and clears frontend state.
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Backend logout encountered error, clearing local state', err);
    } finally {
      // Clear frontend authentication state
      setUser(null);
      setAccessTokenState(null);
      setAccessToken(null);
    }
  };

  const value = {
    // Current user state
    user,
    // Access token state
    accessToken,
    token: accessToken,
    // Authentication loading state
    loading,
    isLoading: loading,
    isAuthenticated: Boolean(user && accessToken),

    // Core authentication actions
    login,
    Login: login,
    logout,
    Logout: logout,
    refreshToken,
    RefreshToken: refreshToken,
    getCurrentUser,
    GetCurrentUser: getCurrentUser,
    refreshProfile: getCurrentUser,

    // Account registration & verification
    signup,
    verifyEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
