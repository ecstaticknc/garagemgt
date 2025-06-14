// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, Alert, ImageBackground } from 'react-native';
import { TextInput, Button, ActivityIndicator, Text } from 'react-native-paper';
import { useAuth } from '../../../../context/AuthContext'; // Adjust the import path as necessary

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState(''); // Corresponds to proprietorMobile
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth(); // Get login function, loading, and error from context

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Login Error', 'Please enter both username and password.');
      return;
    }

    const success = await login(username, password);
    if (success) {
      // Login successful, AuthContext will handle navigation to HomeScreen
      // No explicit navigation.navigate('Home') needed here because App.js renders based on userScId
    } else {
      // Error handled by AuthContext and displayed here
      // Alert.alert('Login Failed', error || 'Invalid credentials'); // Error is already shown below
    }
  };

  return (
<View style={styles.background}>
      <View style={styles.overlay} />
      <View style={styles.container}>
        <Text style={styles.title}>Welcome Back!</Text>
        <TextInput
          label="Mobile Number (Username)"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
          left={<TextInput.Icon icon="account" />}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
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
  label={isLoading ? 'Logging In...' : 'Login'}
/>
      </View>
   </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', // Dark overlay for better text readability
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  input: {
    width: '100%',
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
  },
  button: {
    color: '#fff',  
    width: '100%',
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: '#007bff', // Example primary color
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 8,
    borderRadius: 5,
  },
});

export default LoginScreen; 