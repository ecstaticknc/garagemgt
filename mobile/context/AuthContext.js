// context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../app/config/axiosInstance'; 
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userScId, setUserScId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
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
    setLoginLoading(true);
    setError(null);
    try {
      const response = await API._post('/login', { username, password });
      const userData = response?.data?.data;
      console.log("response in login", response)

      if (userData && userData.scId) {
        await AsyncStorage.setItem('userScId', String(userData.scId)); 
        setUserScId(userData.scId);
        console.log('Login successful. scId>', userData.scId);
        return true;
      } else {
        setError('Login successful, but no service center ID found in response');
        return false;
      }
    } catch (e) {
      console.error('Login failed!', e);
      setError(e?.response?.data?.msg || 'Invalid credentials or network issue');
      return false;
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userScId'); 
      setUserScId(null);
      console.log('Logged out');
    } catch (e) {
      console.error("Failed to clear scId from AsyncStorage", e);
    }
  };

  return (
    <AuthContext.Provider value={{ userScId, isLoading, loginLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
