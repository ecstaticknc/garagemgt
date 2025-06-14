// screens/Customer/CustomerFormScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Appbar, TextInput, Button, ActivityIndicator, Text } from 'react-native-paper';
import { _post, _put } from '../../../../config/axiosInstance';


const CustomerFormScreen = ({ navigation, route }) => { // It must be a function component
  const existingCustomer = route.params?.customer;

  const [customerName, setCustomerName] = useState(existingCustomer?.customerName || '');
  const [mobile, setMobile] = useState(existingCustomer?.mobile || '');
  const [vehicles, setVehicles] = useState(existingCustomer?.vehicles || '');
  const [regDate, setRegDate] = useState(existingCustomer?.regDate ? existingCustomer.regDate.split('T')[0] : '');
  const [scId, setScId] = useState(existingCustomer?.scId ? String(existingCustomer.scId) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: existingCustomer ? 'Edit Customer' : 'Add New Customer',
      headerShown: false,
    });
  }, [navigation, existingCustomer]);

  const handleSave = async () => {
    if (!customerName.trim() || !mobile.trim()) {
      Alert.alert('Validation Error', 'Customer Name and Mobile are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const customerData = { customerName, mobile, vehicles, regDate, scId: scId ? parseInt(scId) : null };

      if (existingCustomer) {
        await _put(`/customers/${existingCustomer.id}`, customerData); // Using _put
        Alert.alert('Success', 'Customer updated successfully!');
      } else {
        await _post('/customers', customerData); // Using _post
        Alert.alert('Success', 'Customer added successfully!');
      }
      navigation.goBack();
    } catch (err) {
      console.error('Error saving customer:', err);
      setError('Failed to save customer. Please check your inputs and try again.');
      Alert.alert('Error', 'Failed to save customer. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={existingCustomer ? 'Edit Customer' : 'Add Customer'} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          label="Customer Name"
          value={customerName}
          onChangeText={setCustomerName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Mobile"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Vehicles (e.g., MH-13-SD-4, MH-12-DF-5423)"
          value={vehicles}
          onChangeText={setVehicles}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Registration Date (YYYY-MM-DD)"
          value={regDate}
          onChangeText={setRegDate}
          mode="outlined"
          placeholder="e.g., 2024-01-15"
          style={styles.input}
        />
        <TextInput
          label="Service Center ID"
          value={scId}
          onChangeText={setScId}
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
          {existingCustomer ? 'Update Customer' : 'Add Customer'}
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

export default CustomerFormScreen;