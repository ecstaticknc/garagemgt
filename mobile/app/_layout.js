// app/_layout.js
import { Slot, Stack } from 'expo-router'; // Removed Redirect, will use Stack for conditional rendering
import { AuthProvider, useAuth } from './../context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Define the Unauthenticated Stack for login/signup etc.
const AuthStack = () => (
  <Stack screenOptions={{ headerShown: false }}>
    {/* This refers to the file app/LoginScreen.js */}
    <Stack.Screen name="LoginScreen" />
    {/* Add other unauthenticated screens here if you have them, e.g., <Stack.Screen name="Signup" component={SignupScreen} /> */}
  </Stack>
);

// Define the Authenticated App entry point
// This Slot will render whatever is defined in your app/(drawer)/_layout.js
// because that's the next level in your file-based routing for authenticated users.
const AuthenticatedApp = () => (
  <Slot />
);

function RootLayoutContent() {
  const { userScId, isLoading } = useAuth();

  // Uncomment these logs if you want to verify state changes after this fix
  // console.log("isLoading in RootLayoutContent:", isLoading);
  // console.log("userScId in RootLayoutContent:", userScId);

  if (isLoading) {
    // Show a loading indicator while checking auth state from AsyncStorage
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // If userScId exists, render the AuthenticatedApp (which loads the drawer/tabs).
  // Otherwise, render the AuthStack (LoginScreen).
  return userScId ? <AuthenticatedApp /> : <AuthStack />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});