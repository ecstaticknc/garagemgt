// screens/Customer/CustomerFormScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Appbar, TextInput, Button, ActivityIndicator, Text, HelperText } from 'react-native-paper';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import API from '../../../config/axiosInstance';
import { useLocalSearchParams, useNavigation } from 'expo-router';

const CustomerFormScreen = () => {
  const navigation = useNavigation();
  const localSearchParams = useLocalSearchParams();
  const existingCustomer = localSearchParams?.customer ? JSON.parse(localSearchParams.customer) : null;

  const [customerName, setCustomerName] = useState(existingCustomer?.customerName || '');
  const [mobile, setMobile] = useState(existingCustomer?.mobile || '');
  const [vehicles, setVehicles] = useState(existingCustomer?.vehicles || '');
  const [regDate, setRegDate] = useState(existingCustomer?.regDate ? existingCustomer.regDate.split('T')[0] : '');
  const [scId, setScId] = useState(existingCustomer?.scId ? String(existingCustomer.scId) : '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    customerName: '',
    mobile: '',
    vehicles: '',
    regDate: ''
  });

  useEffect(() => {
    navigation.setOptions({
      headerTitle: existingCustomer ? 'Edit Customer' : 'Add New Customer',
      headerShown: false,
    });
  }, [navigation, existingCustomer]);

  const showDatePicker = () => {
    Keyboard.dismiss();
    DateTimePickerAndroid.open({
      value: regDate ? new Date(regDate) : new Date(),
      onChange: (event, selectedDate) => {
        if (event.type !== 'dismissed') {
          const currentDate = selectedDate.toISOString().split('T')[0];
          setRegDate(currentDate);
        }
      },
      mode: 'date',
      display: 'calendar',
    });
  };

  const validateMobile = (number) => {
    const regex = /^\d{0,10}$/;
    return regex.test(number);
  };

  const validateVehicle = (vehicle) => {
    if (!vehicle) return true;
    const regex = /^[A-Z]{2}-\d{2}-[A-Z]{2}-\d{4}(,\s*[A-Z]{2}-\d{2}-[A-Z]{2}-\d{4})*$/;
    return regex.test(vehicle);
  };

  const validateForm = () => {
    const newErrors = {
      customerName: !customerName.trim() ? 'Customer Name is required' : '',
      mobile: !mobile.trim() ? 'Mobile is required' : 
             mobile.length !== 10 ? 'Mobile must be 10 digits' : '',
      vehicles: !validateVehicle(vehicles) ? 'Format: MH-12-DF-5423 (comma separated for multiple)' : '',
      regDate: ''
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const customerData = { 
        customerName: customerName.trim(), 
        mobile: mobile.trim(), 
        vehicles: vehicles.trim(), 
        regDate, 
        scId: scId ? parseInt(scId) : null 
      };

      if (existingCustomer) {
        await API._put(`/customers/${existingCustomer.id}`, customerData);
        Alert.alert('Success', 'Customer updated successfully!');
      } else {
        await API._post('/customers', customerData);
        Alert.alert('Success', 'Customer added successfully!');
      }
      navigation.goBack();
    } catch (err) {
      console.error('Error saving customer:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content 
            title={existingCustomer ? 'Edit Customer' : 'Add Customer'} 
            titleStyle={styles.headerTitle}
          />
        </Appbar.Header>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            label="Customer Name *"
            value={customerName}
            onChangeText={setCustomerName}
            mode="outlined"
            style={styles.input}
            error={!!errors.customerName}
          />
          <HelperText type="error" visible={!!errors.customerName}>
            {errors.customerName}
          </HelperText>

          <TextInput
            label="Mobile *"
            value={mobile}
            onChangeText={(text) => {
              if (validateMobile(text)) {
                setMobile(text);
              }
            }}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
            maxLength={10}
            error={!!errors.mobile}
          />
          <HelperText type="error" visible={!!errors.mobile}>
            {errors.mobile}
          </HelperText>

          <TextInput
            label="Vehicles (e.g., MH-12-DF-5423)"
            value={vehicles}
            onChangeText={setVehicles}
            mode="outlined"
            style={styles.input}
            error={!!errors.vehicles}
            placeholder="MH-12-AB-1234, MH-13-CD-5678"
          />
          <HelperText type="error" visible={!!errors.vehicles}>
            {errors.vehicles}
          </HelperText>

          <TextInput
            label="Registration Date"
            value={regDate}
            mode="outlined"
            style={styles.input}
            right={<TextInput.Icon icon="calendar" onPress={showDatePicker} />}
            onFocus={showDatePicker}
            showSoftInputOnFocus={false}
          />

          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
          >
            {existingCustomer ? 'Update Customer' : 'Add Customer'}
          </Button>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  input: {
    marginBottom: 4,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 24,
    borderRadius: 8,
    paddingVertical: 8,
    backgroundColor: '#4a6da7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  buttonContent: {
    height: 48,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: -8,
    marginBottom: 12,
  },
});

export default CustomerFormScreen;