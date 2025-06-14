// context/AuthContext.js
import React, { createContext, useContext, useState } from 'react';

// Create the Auth Context
const AuthContext = createContext(null);

// Custom hook to use the Auth Context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [loggedInUser, setLoggedInUser] = useState(null); // Stores the user object { id, username, password, role, firstLoginDone }

  const login = (user) => {
    setLoggedInUser(user);
  };

  const logout = () => {
    setLoggedInUser(null);
  };

  const updateFirstLoginDone = (userId) => {
    setLoggedInUser(prevUser => {
      if (prevUser && prevUser.id === userId) {
        return { ...prevUser, firstLoginDone: 1 };
      }
      return prevUser;
    });
  };

  const value = {
    loggedInUser,
    login,
    logout,
    updateFirstLoginDone,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;