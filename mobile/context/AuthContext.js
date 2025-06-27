// context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../app/config/axiosInstance'; 
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userScId, setUserScId] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null); // State to store the full user object including role
  const [isLoading, setIsLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => { // Renamed to loadUser to reflect loading more than just scId
      try {
        const storedScId = await AsyncStorage.getItem('userScId');
        const storedUser = await AsyncStorage.getItem('loggedInUser'); // Try to load full user object
        
        if (storedScId) {
          // Parse as int, but store as is. 0 is a valid number.
          setUserScId(parseInt(storedScId)); 
        }
        if (storedUser) {
            setLoggedInUser(JSON.parse(storedUser)); // Parse and set the full user object
        }
      } catch (e) {
        console.error("Failed to load user data from AsyncStorage", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (username, password) => {
    setLoginLoading(true);
    setError(null);
    try {
      const response = await API._post('/login', { username, password });
      const userData = response?.data?.data;
     // console.log("response in login", response);

      // Corrected condition: Check if userData exists AND scId is explicitly not null or undefined
      // This allows 0 to be a valid scId.
      if (userData && (userData.scId !== null && typeof userData.scId !== 'undefined')) {
        await AsyncStorage.setItem('userScId', String(userData.scId)); 
        await AsyncStorage.setItem('loggedInUser', JSON.stringify(userData)); // Store the full user data
        setUserScId(userData.scId);
        setLoggedInUser(userData); // Set the full user data in state
       // console.log('Login successful. scId>', userData.scId, 'role>', userData.role);
        return true;
      } else {
        // This else block will now only hit if scId is genuinely missing or null/undefined
        setError('Login successful, but service center ID is missing or invalid in response');
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
      await AsyncStorage.removeItem('loggedInUser'); // Remove full user object
      setUserScId(null);
      setLoggedInUser(null); // Clear user data on logout
      console.log('Logged out');
    } catch (e) {
      console.error("Failed to clear user data from AsyncStorage", e);
    }
  };

  return (
    <AuthContext.Provider value={{ userScId, loggedInUser, isLoading, loginLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
