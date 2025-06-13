// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { ActivityIndicator, View, StyleSheet } from 'react-native'; // Import for loading indicator

// Import your screens
import CustomerListScreen from './screens/Customer/CustomerListScreen';
import CustomerFormScreen from './screens/Customer/CustomerFormScreen';
import CustomerDetailScreen from './screens/Customer/CustomerDetailScreen';
import ServiceCenterListScreen from './screens/ServiceCenter/ServiceCenterListScreen';
import ServiceCenterFormScreen from './screens/ServiceCenter/ServiceCenterFormScreen';
import ServiceHistoryListScreen from './screens/ServiceHistory/ServiceHistoryListScreen';
import ServiceHistoryFormScreen from './screens/ServiceHistory/ServiceHistoryFormScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/Auth/LoginScreen'; // <-- Import your LoginScreen

// Authentication context
import { AuthProvider, useAuth } from './context/AuthContext'; // <-- Import AuthProvider and useAuth

const Stack = createStackNavigator();

// A component that renders the appropriate stack based on authentication
function RootNavigator() {
  const { userScId, isLoading } = useAuth(); // Get auth state from context

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userScId ? (
        // User is logged in, show main app screens
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CustomerList" component={CustomerListScreen} />
          <Stack.Screen name="CustomerForm" component={CustomerFormScreen} />
          <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
          <Stack.Screen name="ServiceCenterList" component={ServiceCenterListScreen} />
          <Stack.Screen name="ServiceCenterForm" component={ServiceCenterFormScreen} />
          <Stack.Screen name="ServiceHistoryList" component={ServiceHistoryListScreen} />
          <Stack.Screen name="ServiceHistoryForm" component={ServiceHistoryFormScreen} />
        </>
      ) : (
        // No user logged in, show login screen
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider> {/* Wrap the entire app with AuthProvider */}
        <NavigationContainer>
          <RootNavigator /> {/* Use the RootNavigator to handle conditional rendering */}
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});