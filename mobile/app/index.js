// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ImageBackground,
//   ActivityIndicator,
//   Image,
//   Platform,
//   Alert,
//   Modal,
// } from 'react-native';
// import { router } from 'expo-router';
// import * as LocalAuthentication from 'expo-local-authentication';
// import * as Haptics from 'expo-haptics';
// import { Ionicons } from '@expo/vector-icons';
// import { useSQLiteContext } from 'expo-sqlite'; // Import useSQLiteContext

// // Import the initializeDatabase function
// import { initializeDatabase } from '../assets/DatabaseInit';
// import { useAuth } from './(drawer)/AuthContext';

// const LoginScreen = () => {
//   const db = useSQLiteContext(); // Access the database instance from context
//   const auth = useAuth();
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(true); // Set to true initially to load DB
//   const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
//   const [error, setError] = useState('');
//   const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');
//   //const [loggedInUser, setLoggedInUser] = useState(null); // To store the user object after successful login

//   useEffect(() => {
//     const setupDatabaseAndBiometrics = async () => {
//       setLoading(true);
//       try {
//         if (!db) {
//           console.warn('DB context is null in useEffect, retrying or waiting...');
//           return;
//         }
//         await initializeDatabase(db);
       

//         const compatible = await LocalAuthentication.hasHardwareAsync();
//         const enrolled = await LocalAuthentication.isEnrolledAsync();

//         if (compatible && enrolled) {
//           setIsBiometricAvailable(true);
//         } else if (!compatible) {
//           console.warn('Biometric authentication not available on this device.');
//         } else if (!enrolled) {
//           console.warn(
//             'No biometric credentials enrolled. Please set up biometrics in your device settings.'
//           );
//         }
//       } catch (err) {
//         console.error('Error in LoginScreen useEffect during DB setup:', err);
//         setError('App initialization failed. Please try again.');
//       } finally {
//         setLoading(false);        
//       }
//     };

//     if (db) {
//       setupDatabaseAndBiometrics();
//     } else {
//       console.warn('Waiting for database context to be available.');
//     }
//   }, [db]);

//   const handleBiometricLogin = async () => {
//     setError('');
//     try {
//       const result = await LocalAuthentication.authenticateAsync({
//         promptMessage: 'Authenticate to Samarth Caters',
//         promptTitle: 'Biometric Login',
//         disableDeviceFallback: true,
//         cancelLabel: 'Cancel',
//       });

//       if (result.success) {
//         await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//         const defaultBiometricUser = await db.getFirstAsync(
//           `SELECT * FROM users WHERE username = ?;`,
//           ['user'] // Assuming 'user' is the default biometric user for biometrics
//         );

//         if (defaultBiometricUser) {
//           auth.login(defaultBiometricUser); // <--- Set the logged-in user in AuthContext
//           setLoading(true);
//           setTimeout(() => {
//             setLoading(false);
//             router.replace('/(drawer)/(tabs)/home');
//           }, 500);
//         } else {
//           setError('Biometric login failed: Default user not found.');
//         }
//       } else {
//         await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//         setError(
//           result.error === 'user_cancel' ? 'Authentication canceled' : 'Authentication failed'
//         );
//       }
//     } catch (err) {
//       await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//       setError('Authentication error: ' + err.message);
//     }
//   };

//   const handleManualLogin = async () => {
//     if (!username.trim() || !password.trim()) {
//       setError('Please enter both username and password');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       const user = await db.getFirstAsync(
//         `SELECT * FROM users WHERE username = ? AND password = ?;`,
//         [username, password]
//       );

//       if (user) {
//         await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//         auth.login(user); // <--- Set the logged-in user in AuthContext

//         if (user.firstLoginDone === 0) {
//           setShowPasswordChangeModal(true);
//         } else {
//           router.replace('/(drawer)/(tabs)/home');
//         }
//       } else {
//         await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//         setError('Invalid username or password.');
//       }
//     } catch (err) {
//       console.error('Error during manual login:', err);
//       await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//       setError('An error occurred during login. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChangePassword = async () => {
//     if (!newPassword.trim() || !confirmNewPassword.trim()) {
//       Alert.alert('Error', 'Please enter both new password and confirm password.');
//       return;
//     }
//     if (newPassword !== confirmNewPassword) {
//       Alert.alert('Error', 'New password and confirm password do not match.');
//       return;
//     }
//     const currentLoggedInUser = auth.loggedInUser;

//     if (!currentLoggedInUser) {
//       Alert.alert('Error', 'No user logged in for password change.');
//       setLoading(false);
//       return;
//     }

//     // Check if new password is same as old
//     if (newPassword === currentLoggedInUser.password) {
//       Alert.alert('Error', 'New password cannot be the same as the old password.');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       // console.log(`[handleChangePassword] Attempting to update DB for ID: ${currentLoggedInUser.id} with new password: ${newPassword} username : ${username} p`);
//       // 1. Update password and firstLoginDone in the database
//       const jj = await db.execAsync(
//         `UPDATE users SET password ='${newPassword}', firstLoginDone =1 WHERE username = '${username}'`
//       );
//       console.log(
//         `[handleChangePassword] Password updated in DB for user ID: ${currentLoggedInUser.id} "debaug" ${jj}`
//       );
//      // const user1 = await db.getAllAsync(`SELECT * FROM users `, [username, password]);

//       // console.log('Manual login attempt:', 'tp', user1);

//       await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

//       // 2. Create a *new* user object with the updated password and firstLoginDone
//       // This is crucial to ensure the AuthContext holds the latest user data.
//       const updatedUserInContext = {
//         ...currentLoggedInUser,
//         password: newPassword, // Update the password field
//         firstLoginDone: 1, // Also update firstLoginDone
//       };

//       // 3. Update the AuthContext with the completely updated user object
//       // Calling auth.login will replace the old loggedInUser with the new one.
//       auth.login(updatedUserInContext); // <--- THIS IS THE KEY CHANGE

//       Alert.alert('Success', 'Password updated successfully!', [
//         {
//           text: 'OK',
//           onPress: () => {
//             setShowPasswordChangeModal(false);
//             setLoading(false);
//             // Navigate to home, where the context will reflect the new password
//             router.replace('/(drawer)/(tabs)/home');
//           },
//         },
//       ]);
//     } catch (err) {
//       console.error('Error changing password:', err);
//       await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//       setError('Failed to update password. Please try again.');
//       setLoading(false);
//     }
//   };

//   return (
//     <ImageBackground
//       source={require('../assets/RB Gradient Background 735.jpg')}
//       style={styles.background}
//       resizeMode="cover">
//       <View style={styles.overlay}>
//         <View style={styles.container}>
//           {/* Circular Logo */}
//           <View style={styles.logoContainer}>
//             <Image
//               source={require('../assets/logo.png')}
//               style={styles.logo}
//               resizeMode="contain"
//             />
//           </View>

//           {/* Login Form */}
//           <View style={styles.formContainer}>
//             {loading ? (
//               <ActivityIndicator size="large" color="#FFFFFF" />
//             ) : (
//               <>
//                 {error ? (
//                   <View style={styles.errorContainer}>
//                     <Text style={styles.errorText}>{error}</Text>
//                   </View>
//                 ) : null}

//                 <TextInput
//                   style={styles.input}
//                   placeholder="Username"
//                   placeholderTextColor="#AAAAAA"
//                   value={username}
//                   onChangeText={setUsername}
//                   autoCapitalize="none"
//                   autoCorrect={false}
//                 />

//                 <TextInput
//                   style={styles.input}
//                   placeholder="Password"
//                   placeholderTextColor="#AAAAAA"
//                   value={password}
//                   onChangeText={setPassword}
//                   secureTextEntry
//                   autoCapitalize="none"
//                 />

//                 <TouchableOpacity
//                   style={styles.loginButton}
//                   onPress={handleManualLogin}
//                   disabled={loading}>
//                   <Text style={styles.loginButtonText}>LOGIN</Text>
//                 </TouchableOpacity>

//                 <View style={styles.linksContainer}>
//                   <Text style={styles.linkSeparator}>|</Text>
//                 </View>

//                 {isBiometricAvailable && (
//                   <TouchableOpacity
//                     style={styles.biometricButton}
//                     onPress={handleBiometricLogin}
//                     disabled={loading}>
//                     <Ionicons
//                       name={Platform.OS === 'ios' ? 'ios-finger-print' : 'finger-print'}
//                       size={24}
//                       color="#FFFFFF"
//                       style={styles.biometricIcon}
//                     />
//                     <Text style={styles.biometricText}>
//                       {Platform.OS === 'ios' ? 'Use Face ID' : 'Use Fingerprint'}
//                     </Text>
//                   </TouchableOpacity>
//                 )}
//               </>
//             )}
//           </View>
//         </View>
//       </View>

//       {/* Password Change Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={showPasswordChangeModal}
//         onRequestClose={() => {
//           Alert.alert('Password Change Required', 'You must change your password to continue.');
//         }}>
//         <View style={styles.centeredView}>
//           <View style={styles.modalView}>
//             <Text style={styles.modalTitle}>Change Initial Password</Text>
//             <Text style={styles.modalText}>
//               This is your first login. Please change your password to continue.
//             </Text>
//             <TextInput
//               style={styles.input}
//               placeholder="New Password"
//               placeholderTextColor="#AAAAAA"
//               value={newPassword}
//               onChangeText={setNewPassword}
//               secureTextEntry
//               autoCapitalize="none"
//             />
//             <TextInput
//               style={styles.input}
//               placeholder="Confirm New Password"
//               placeholderTextColor="#AAAAAA"
//               value={confirmNewPassword}
//               onChangeText={setConfirmNewPassword}
//               secureTextEntry
//               autoCapitalize="none"
//             />
//             <TouchableOpacity
//               style={styles.changePasswordButton}
//               onPress={handleChangePassword}
//               disabled={loading}>
//               <Text style={styles.loginButtonText}>Change Password</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </ImageBackground>
//   );
// };

// const styles = StyleSheet.create({
//   background: {
//     flex: 1,
//     width: '100%',
//     height: '100%',
//   },
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.4)',
//     justifyContent: 'center',
//   },
//   container: {
//     flex: 0,
//     justifyContent: 'center',
//     paddingHorizontal: 30,
//     marginTop: -40,
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginBottom: 30,
//     marginTop: 20,
//   },
//   logo: {
//     width: 175,
//     height: 175,
//     borderRadius: 95,
//     borderWidth: 3,
//     borderColor: '#FFFFFF',
//     backgroundColor: 'rgba(255, 255, 255, 0.45)',
//   },
//   formContainer: {
//     backgroundColor: 'rgba(0, 0, 0, 0.47)',
//     borderRadius: 15,
//     padding: 25,
//     marginTop: 10,
//   },
//   input: {
//     height: 50,
//     borderColor: '#555555',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//     color: '#FFFFFF',
//     backgroundColor: 'rgba(255,255,255,0.1)',
//     fontSize: 16,
//   },
//   loginButton: {
//     backgroundColor: '#4A90E2',
//     padding: 15,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 10,
//     marginBottom: 20,
//   },
//   loginButtonText: {
//     color: '#FFFFFF',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   linksContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   linkText: {
//     color: '#AAAAAA',
//     fontSize: 14,
//     marginHorizontal: 10,
//   },
//   linkSeparator: {
//     color: '#555555',
//     fontSize: 14,
//   },
//   biometricButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#4A90E2',
//     marginTop: 10,
//   },
//   biometricIcon: {
//     marginRight: 10,
//   },
//   biometricText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//   },
//   errorContainer: {
//     backgroundColor: 'rgba(255,0,0,0.2)',
//     padding: 10,
//     borderRadius: 5,
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: 'rgba(255,0,0,0.5)',
//   },
//   errorText: {
//     color: '#FF5555',
//     textAlign: 'center',
//     fontSize: 14,
//   },
//   // Modal styles
//   centeredView: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//   },
//   modalView: {
//     margin: 20,
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     borderRadius: 20,
//     padding: 35,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//     width: '90%',
//   },
//   modalTitle: {
//     marginBottom: 15,
//     textAlign: 'center',
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#FFFFFF',
//   },
//   modalText: {
//     marginBottom: 20,
//     textAlign: 'center',
//     fontSize: 16,
//     color: '#DDDDDD',
//   },
//   changePasswordButton: {
//     backgroundColor: '#28A745', // Green color for success
//     padding: 15,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 20,
//     width: '100%',
//   },
// });

// export default LoginScreen;

// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, Alert, ImageBackground } from 'react-native';
import { TextInput, Button, ActivityIndicator, Text } from 'react-native-paper';

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
