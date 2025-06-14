// screens/ServiceCenter/ServiceCenterFormScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Appbar, TextInput, Button, ActivityIndicator, Text } from 'react-native-paper';
import { _post, _put } from '../../../../config/axiosInstance';

const ServiceCenterFormScreen = ({ navigation, route }) => {
  const existingServiceCenter = route.params?.serviceCenter;

  // Adjust useState initial values to use correct backend keys
  const [centerName, setCenterName] = useState(existingServiceCenter?.serviceCenterName || ''); // Corrected key
  const [location, setLocation] = useState(existingServiceCenter?.serviceCenterAddress || ''); // Corrected key
  const [contactNumber, setContactNumber] = useState(existingServiceCenter?.proprietorMobile || ''); // Corrected key
  const [proprietorName, setProprietorName] = useState(existingServiceCenter?.proprietorName || ''); // New field based on backend
  const [proprietorEmail, setProprietorEmail] = useState(existingServiceCenter?.proprietorEmail || ''); // New field based on backend

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: existingServiceCenter ? 'Edit Service Center' : 'Add New Service Center',
      headerShown: false,
    });
  }, [navigation, existingServiceCenter]);

  const handleSave = async () => {
    // Adjusted validation to match new fields if needed
    if (!centerName.trim() || !location.trim() || !contactNumber.trim() || !proprietorName.trim() || !proprietorEmail.trim()) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Create data object using correct backend keys
      const serviceCenterData = {
        serviceCenterName: centerName, // Corrected key
        serviceCenterAddress: location, // Corrected key
        proprietorMobile: contactNumber, // Corrected key
        proprietorName: proprietorName, // New field
        proprietorEmail: proprietorEmail, // New field
        // Add other fields from your backend response if they are mutable
      };

      if (existingServiceCenter) {
        await _put(`/servicecenters/${existingServiceCenter.id}`, serviceCenterData);
        Alert.alert('Success', 'Service Center updated successfully!');
      } else {
        await _post('/servicecenters', serviceCenterData);
        Alert.alert('Success', 'Service Center added successfully!');
      }
      navigation.goBack();
    } catch (err) {
      console.error('Error saving service center:', err);
      setError('Failed to save service center. Please check your inputs and try again.');
      Alert.alert('Error', 'Failed to save service center. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={existingServiceCenter ? 'Edit Service Center' : 'Add Service Center'} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          label="Service Center Name" // Updated label for clarity
          value={centerName}
          onChangeText={setCenterName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Service Center Address" // Updated label for clarity
          value={location}
          onChangeText={setLocation}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Proprietor Mobile" // Updated label for clarity
          value={contactNumber}
          onChangeText={setContactNumber}
          keyboardType="phone-pad"
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Proprietor Name" // New TextInput
          value={proprietorName}
          onChangeText={setProprietorName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Proprietor Email" // New TextInput
          value={proprietorEmail}
          onChangeText={setProprietorEmail}
          keyboardType="email-address"
          mode="outlined"
          style={styles.input}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          {existingServiceCenter ? 'Update Service Center' : 'Add Service Center'}
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#6200ee',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default ServiceCenterFormScreen;