// screens/ServiceHistory/ServiceHistoryFormScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Appbar, TextInput, Button, ActivityIndicator, Text } from 'react-native-paper';
import { _post, _put } from '../../config/axiosInstance';

const ServiceHistoryFormScreen = ({ navigation, route }) => {
  const existingServiceHistory = route.params?.serviceHistory;
  const initialCustomerId = route.params?.customerId || ''; // If navigated from CustomerDetail

  const [vehicleNo, setVehicleNo] = useState(existingServiceHistory?.vehicleNo || '');
  const [services, setServices] = useState(existingServiceHistory?.services || '');
  const [serviceDate, setServiceDate] = useState(existingServiceHistory?.serviceDate ? existingServiceHistory.serviceDate.split('T')[0] : '');
  const [serviceRemark, setServiceRemark] = useState(existingServiceHistory?.serviceRemark || '');
  const [customerId, setCustomerId] = useState(existingServiceHistory?.customerId ? String(existingServiceHistory.customerId) : initialCustomerId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: existingServiceHistory ? 'Edit Service Entry' : 'Add New Service Entry',
      headerShown: false,
    });
  }, [navigation, existingServiceHistory]);

  const handleSave = async () => {
    if (!vehicleNo.trim() || !services.trim() || !serviceDate.trim() || !customerId.trim()) {
      Alert.alert('Validation Error', 'Vehicle No, Services, Service Date, and Customer ID are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const serviceHistoryData = {
        vehicleNo,
        services,
        serviceDate,
        serviceRemark,
        customerId: parseInt(customerId),
      };

      if (existingServiceHistory) {
        await _put(`/servicehistory/${existingServiceHistory.id}`, serviceHistoryData);
        Alert.alert('Success', 'Service entry updated successfully!');
      } else {
        await _post('/servicehistory', serviceHistoryData);
        Alert.alert('Success', 'Service entry added successfully!');
      }
      navigation.goBack();
    } catch (err) {
      console.error('Error saving service history:', err);
      setError('Failed to save service history. Please check your inputs and try again.');
      Alert.alert('Error', 'Failed to save service history. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={existingServiceHistory ? 'Edit Service Entry' : 'Add Service Entry'} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          label="Vehicle Number"
          value={vehicleNo}
          onChangeText={setVehicleNo}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Services (comma-separated)"
          value={services}
          onChangeText={setServices}
          mode="outlined"
          placeholder="e.g., oilChange, fullService"
          style={styles.input}
        />
        <TextInput
          label="Service Date (YYYY-MM-DD)"
          value={serviceDate}
          onChangeText={setServiceDate}
          mode="outlined"
          placeholder="e.g., 2024-01-15"
          style={styles.input}
        />
        <TextInput
          label="Service Remark"
          value={serviceRemark}
          onChangeText={setServiceRemark}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />
        <TextInput
          label="Customer ID"
          value={customerId}
          onChangeText={setCustomerId}
          keyboardType="numeric"
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
          {existingServiceHistory ? 'Update Service Entry' : 'Add Service Entry'}
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

export default ServiceHistoryFormScreen;