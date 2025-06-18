// app/_layout.js
import { Slot, Stack } from 'expo-router';
import { AuthProvider, useAuth } from './../context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider, useThemeToggle } from '../context/ThemeContext';
import { useEffect } from 'react'; // Import useEffect
import { useRouter } from 'expo-router';

const AuthStack = () => (
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="index" />
  </Stack>
);

// REMOVED AuthenticatedApp = () => <Slot />;
// Instead, we will directly render the Stack.Screen for (drawer)

function RootLayoutContent() {
  const { userScId, isLoading } = useAuth();
  const { theme } = useThemeToggle(); // Get current theme from ThemeContext
const router = useRouter();

useEffect(() => {
    if (!userScId && !isLoading) {
      router.replace('/'); // Safe to navigate when logout is finished
    }
  }, [userScId, isLoading]);
  
  // You might want to use SplashScreen from 'expo-router' for better loading experience
  // For simplicity, keeping ActivityIndicator here as per your original code
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      {userScId ? (
        // When authenticated, render the (drawer) group as a screen
        // This will mount your drawer navigator and its children
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(drawer)" />
        </Stack>
      ) : (
        // When not authenticated, render the authentication stack (login)
        <AuthStack />
      )}
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
