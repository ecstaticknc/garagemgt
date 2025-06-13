// context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { _post } from '../config/axiosInstance'; // Assuming _post is for your API calls

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userScId, setUserScId] = useState(null); // Stores the logged-in service center ID
  const [isLoading, setIsLoading] = useState(true); // To check if we're loading auth state
  const [error, setError] = useState(null); // For login errors

  useEffect(() => {
    // Check local storage for userScId on app start
    const loadUserScId = async () => {
      try {
        const storedScId = await AsyncStorage.getItem('userScId');
        if (storedScId) {
          setUserScId(parseInt(storedScId));
        }
      } catch (e) {
        console.error("Failed to load scId from AsyncStorage", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserScId();
  }, []);

  const login = async (username, password) => {
    setIsLoading(true);
    setError(null); // Clear previous errors
    try {
      const response = await _post('/login', { username, password }); // Your backend login endpoint
      const userData = response.data.data; // Assuming your backend returns user data including scId

      if (userData && userData.scId) {
        await AsyncStorage.setItem('userScId', String(userData.scId));
        setUserScId(userData.scId);
        console.log('Login successful. scId:', userData.scId);
        return true; // Indicate successful login
      } else {
        setError('Login successful, but no service center ID found in response.');
        return false; // Indicate failed login
      }
    } catch (e) {
      console.error('Login failed:', e);
      const errorMessage = e.response?.data?.msg || 'Invalid credentials or network issue.';
      setError(errorMessage);
      return false; // Indicate failed login
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userScId');
      setUserScId(null);
      console.log('Logged out.');
    } catch (e) {
      console.error("Failed to clear scId from AsyncStorage", e);
    }
  };

  return (
    <AuthContext.Provider value={{ userScId, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};