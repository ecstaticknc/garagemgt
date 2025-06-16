// app/_layout.js
import { Slot, Stack } from 'expo-router';
import { AuthProvider, useAuth } from './../context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider, useThemeToggle } from '../context/ThemeContext';

const AuthStack = () => (
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="index" />
  </Stack>
);

const AuthenticatedApp = () => <Slot />;

function RootLayoutContent() {
  const { userScId, isLoading } = useAuth();
  const { theme } = useThemeToggle(); // Get current theme from ThemeContext

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      {userScId ? <AuthenticatedApp /> : <AuthStack />}
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
