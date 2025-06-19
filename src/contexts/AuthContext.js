import React, { createContext, useContext, useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import amplifyconfig from '../amplifyconfiguration.json';

// Configure Amplify
Amplify.configure(amplifyconfig);

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing authenticated user
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      // User is not authenticated
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: credentials.username,
        password: credentials.password,
      });

      if (isSignedIn) {
        const user = await getCurrentUser();
        setCurrentUser(user);
        return { user, isSignedIn };
      }

      return { isSignedIn, nextStep };
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (userData) => {
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: userData.username,
        password: userData.password,
        options: {
          userAttributes: {
            email: userData.email,
            given_name: userData.firstName || userData.username,
            family_name: userData.lastName || '',
          },
        },
      });

      if (isSignUpComplete) {
        // Auto sign in after successful registration
        const loginResult = await login({
          username: userData.username,
          password: userData.password,
        });
        return loginResult;
      }

      return { isSignUpComplete, userId, nextStep };
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on client side even if server call fails
      setCurrentUser(null);
    }
  };

  const getAuthToken = async () => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    getAuthToken,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
