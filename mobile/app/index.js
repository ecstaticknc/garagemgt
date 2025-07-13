import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useThemeToggle } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const { height } = Dimensions.get('window');

// Secure storage keys
const BIOMETRIC_PREFERENCE_KEY = 'biometric_preference';
const USER_CREDENTIALS_KEY = 'user_credentials';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const theme = useTheme();
  const router = useRouter();
  const [authState, setAuthState] = useState({
    isBiometricAvailable: false,
    isBiometricEnabled: false,
    isCheckingBiometrics: true,
    showManualLogin: false,
    biometricType: null,
  });

  // Check biometric availability and saved preferences on mount
  useEffect(() => {
    const checkAuthOptions = async () => {
      try {
        // Check if biometric auth is available on device
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const biometricType = supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        ) ? 'Face ID' : 
          supportedTypes.includes(
            LocalAuthentication.AuthenticationType.FINGERPRINT
          ) ? 'Fingerprint' : 'Biometric';

        setAuthState(prev => ({
          ...prev,
          isBiometricAvailable: compatible && enrolled,
          biometricType,
        }));

        // Check if user has enabled biometric auth
        const biometricPreference = await SecureStore.getItemAsync(BIOMETRIC_PREFERENCE_KEY);
        setAuthState(prev => ({
          ...prev,
          isBiometricEnabled: biometricPreference === 'true',
        }));

        // If biometric is enabled, try to authenticate
        if (biometricPreference === 'true' && !authState.showManualLogin) {
          const credentials = await SecureStore.getItemAsync(USER_CREDENTIALS_KEY);
          if (credentials) {
            await tryAuthenticateWithBiometrics();
          }
        }
      } catch (error) {
        console.error('Error checking auth options:', error);
      } finally {
        setAuthState(prev => ({ ...prev, isCheckingBiometrics: false }));
      }
    };
    
    checkAuthOptions();
  }, [authState.showManualLogin]);

  const tryAuthenticateWithBiometrics = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Authenticate with ${authState.biometricType} to login`,
        fallbackLabel: 'Use Password Instead',
        disableDeviceFallback: true,
      });

      if (result.success) {
        // Retrieve stored credentials and login automatically
        const credentialsString = await SecureStore.getItemAsync(USER_CREDENTIALS_KEY);
        if (credentialsString) {
          const credentials = JSON.parse(credentialsString);
          const success = await login(credentials.username, credentials.password);
          if (success) {
            router.replace('/(drawer)/(tabs)/Home');
          }
        }
      } else {
        setAuthState(prev => ({ ...prev, showManualLogin: true }));
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setAuthState(prev => ({ ...prev, showManualLogin: true }));
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Login Error', 'Please enter both username and password.');
      return;
    }

    const success = await login(username, password);
    if (success) {
      // Save credentials securely if biometric is available
      if (authState.isBiometricAvailable) {
        await promptBiometricSetup();
      } else {
        router.replace('/(drawer)/(tabs)/Home');
      }
    }
  };

  const promptBiometricSetup = async () => {
    // Check if biometric is already enabled
    const isEnabled = await SecureStore.getItemAsync(BIOMETRIC_PREFERENCE_KEY);
    
    if (isEnabled !== 'true') {
      Alert.alert(
        'Faster Login Available',
        `Would you like to enable ${authState.biometricType} authentication for faster login next time? Your credentials will be securely stored on this device.`,
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => router.replace('/(drawer)/(tabs)/Home'),
          },
          {
            text: 'Enable',
            onPress: async () => {
              try {
                // First verify biometrics again before saving credentials
                const { success } = await LocalAuthentication.authenticateAsync({
                  promptMessage: `Verify your identity to enable ${authState.biometricType} login`,
                });

                if (success) {
                  // Save credentials securely
                  await SecureStore.setItemAsync(
                    USER_CREDENTIALS_KEY,
                    JSON.stringify({ username, password })
                  );
                  // Set biometric preference
                  await SecureStore.setItemAsync(BIOMETRIC_PREFERENCE_KEY, 'true');
                  setAuthState(prev => ({
                    ...prev,
                    isBiometricEnabled: true,
                    showManualLogin: false,
                  }));
                  router.replace('/(drawer)/(tabs)/Home');
                }
              } catch (error) {
                console.error('Error enabling biometrics:', error);
                Alert.alert('Error', `Failed to enable ${authState.biometricType} login. Please try again.`);
              }
            },
          },
        ]
      );
    } else {
      router.replace('/(drawer)/(tabs)/Home');
    }
  };

  const handleManualLoginPress = async () => {
    await LocalAuthentication.cancelAuthenticate();
    setAuthState(prev => ({ ...prev, showManualLogin: true }));
  };

  const handleBiometricLoginPress = async () => {
    setAuthState(prev => ({ ...prev, showManualLogin: false }));
    await tryAuthenticateWithBiometrics();
  };

  const renderAuthOptions = () => {
    if (authState.isCheckingBiometrics) return null;

    if (authState.isBiometricEnabled && !authState.showManualLogin) {
      return (
        <>
          <Button
            mode="contained-tonal"
            onPress={handleBiometricLoginPress}
            style={styles.biometricButton}
            icon="fingerprint"
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {`Login with ${authState.biometricType}`}
          </Button>
          <Button
            mode="text"
            onPress={handleManualLoginPress}
            style={styles.manualLoginButton}
            textColor={theme.colors.primary}
          >
            Use Password Instead
          </Button>
        </>
      );
    }

    return (
      <>
        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          {isLoading ? 'Logging In...' : 'Login'}
        </Button>
        {authState.isBiometricAvailable && !authState.isBiometricEnabled && (
          <Button
            mode="outlined"
            onPress={handleBiometricLoginPress}
            style={styles.biometricButton}
            icon="fingerprint"
            contentStyle={styles.buttonContent}
            labelStyle={[styles.buttonLabel, { color: theme.colors.primary }]}
          >
            {`Try ${authState.biometricType} Login`}
          </Button>
        )}
      </>
    );
  };

  if (authState.isCheckingBiometrics) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Checking security options...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top-right dark mode toggle */}
        <View style={styles.topBar}>
          <IconButton
            icon={isDarkMode ? 'white-balance-sunny' : 'weather-night'}
            size={24}
            onPress={toggleTheme}
            iconColor={theme.colors.primary}
          />
        </View>

        {/* Main content block */}
        <View style={styles.container}>
          <Image
            source={require('../assets/login.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={[styles.title, { color: theme.colors.primary }]}>
            Welcome Back!
          </Text>

          {(authState.showManualLogin || !authState.isBiometricEnabled) && (
            <>
              <TextInput
                label="Mobile Number"
                value={username}
                onChangeText={setUsername}
                keyboardType="phone-pad"
                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                left={<TextInput.Icon icon="account" />}
                autoCapitalize="none"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                left={<TextInput.Icon icon="lock" />}
                autoCapitalize="none"
                theme={{ colors: { primary: theme.colors.primary } }}
              />
            </>
          )}

          {error && (
            <Text style={[styles.errorText, { 
              color: theme.colors.error,
              backgroundColor: theme.colors.errorContainer 
            }]}>
              {error}
            </Text>
          )}

          {renderAuthOptions()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 10,
    zIndex: 999,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 100,
    padding: 20,
    borderRadius: 12,
  },
  logo: {
    height: height * 0.25,
    width: '125%',
    alignSelf: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 10,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
  },
  biometricButton: {
    marginTop: 20,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
  },
  buttonContent: {
    height: '100%',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    padding: 12,
    borderRadius: 6,
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  manualLoginButton: {
    marginTop: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
});

export default LoginScreen;