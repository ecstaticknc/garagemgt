import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
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

const { height } = Dimensions.get('window');

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const theme = useTheme();
  const router = useRouter();

  const handleLogin = async () => {
    console.log('Bypassing login. REMOVE THIS FOR PRODUCTION.');
    router.push('/(drawer)/(tabs)/Home');
    return;
  };

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

          <TextInput
            label="Mobile Number"
            value={username}
            onChangeText={setUsername}
            keyboardType="phone-pad"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

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
    backgroundColor: 'white',
  },
  button: {
    marginTop: 10,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorText: {
    color: '#b00020',
    backgroundColor: '#ffdede',
    padding: 8,
    borderRadius: 6,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default LoginScreen;
