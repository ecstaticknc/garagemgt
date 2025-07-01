// screens/Customer/CustomerFormScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native';
import { Appbar, TextInput, Button, ActivityIndicator, Text, HelperText } from 'react-native-paper';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome';
import API from '../../../config/axiosInstance';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';
import moment from 'moment';

const CustomerFormScreen = () => {
  const { userScId } = useAuth();
  const navigation = useNavigation();
  const localSearchParams = useLocalSearchParams();
  const existingCustomer = localSearchParams?.customer ? JSON.parse(localSearchParams.customer) : null;

  const [customerName, setCustomerName] = useState(existingCustomer?.customerName || '');
  const [mobile, setMobile] = useState(existingCustomer?.mobile || '');
  const [vehicles, setVehicles] = useState(existingCustomer?.vehicles ? existingCustomer.vehicles.split(',').map(v => ({ vehicleNumber: v.trim() })) : [{ vehicleNumber: '' }]);
  const [regDate, setRegDate] = useState(existingCustomer?.regDate ? existingCustomer.regDate.split('T')[0] : new Date().toISOString().split('T')[0]);
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
      headerTitle: existingCustomer ? 'ग्राहक संपादित करा' : 'नवीन ग्राहक जोडा',
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

  const formatVehicleNumber = (text) => {
    // Remove all non-alphanumeric characters and convert to uppercase
    let cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Insert hyphens at appropriate positions
    if (cleaned.length > 2) {
      cleaned = cleaned.substring(0, 2) + '-' + cleaned.substring(2);
    }
    if (cleaned.length > 5) {
      cleaned = cleaned.substring(0, 5) + '-' + cleaned.substring(5);
    }
    if (cleaned.length > 8) {
      cleaned = cleaned.substring(0, 8) + '-' + cleaned.substring(8);
    }
    
    // Limit to 13 characters (including hyphens)
    return cleaned.substring(0, 13);
  };

  const validateVehicle = (vehicle) => {
    if (!vehicle) return true;
    const regex = /^[A-Z]{2}-\d{2}-[A-Z]{2}-\d{1,4}$/;
    return regex.test(vehicle);
  };

  const validateForm = () => {
    const newErrors = {
      customerName: !customerName.trim() ? 'Customer Name is required' : '',
      mobile: !mobile.trim() ? 'Mobile is required' : 
             mobile.length !== 10 ? 'Mobile must be 10 digits' : '',
      vehicles: vehicles.some(v => !validateVehicle(v.vehicleNumber)) ? 'Invalid vehicle format (e.g., MH-12-DF-5423)' : '',
      regDate: ''
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleVehicleChange = (index, text) => {
    const formattedText = formatVehicleNumber(text);
    const newVehicles = [...vehicles];
    newVehicles[index].vehicleNumber = formattedText;
    setVehicles(newVehicles);
  };

  const handleAddVehicle = () => {
    setVehicles([...vehicles, { vehicleNumber: '' }]);
  };

  const handleRemoveVehicle = (index) => {
    if (vehicles.length <= 1) return;
    const newVehicles = [...vehicles];
    newVehicles.splice(index, 1);
    setVehicles(newVehicles);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const vehicleNumbers = vehicles.map(v => v.vehicleNumber).filter(v => v).join(', ');
      
      const customerData = { 
        customerName: customerName.trim(), 
        mobile: mobile.trim(), 
        vehicles: vehicleNumbers, 
        regDate, 
        scId: scId ? parseInt(scId) : userScId 
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
            title={existingCustomer ? 'ग्राहक संपादित करा' : 'नवीन ग्राहक जोडा'} 
            titleStyle={styles.headerTitle}
          />
        </Appbar.Header>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            label="ग्राहकाचे नाव *"
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
            label="मोबाईल *"
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

          <Text style={styles.label}>वाहन क्रमांक:</Text>
          {vehicles.map((vehicle, index) => (
            <View key={index} style={styles.vehicleContainer}>
              <TextInput
                label={`वाहन ${index + 1}`}
                value={vehicle.vehicleNumber}
                onChangeText={(text) => handleVehicleChange(index, text)}
                mode="outlined"
                style={[styles.input, styles.vehicleInput]}
                maxLength={13}
                error={!!errors.vehicles}
              />
              <View style={styles.vehicleActions}>
                {index === vehicles.length - 1 && (
                  <TouchableOpacity onPress={handleAddVehicle}>
                    <Icon name="plus" size={20} color="#4a6da7" style={styles.icon} />
                  </TouchableOpacity>
                )}
                {vehicles.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveVehicle(index)}>
                    <Icon name="minus" size={20} color="#4a6da7" style={styles.icon} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          <HelperText type="error" visible={!!errors.vehicles}>
            {errors.vehicles}
          </HelperText>

          <TextInput
            label="नोंदणी तारीख"
            value={moment(regDate).format('DD-MM-YYYY')}
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
            {existingCustomer ? 'ग्राहक संपादित करा' : 'नवीन ग्राहक जोडा'}
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
  label: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 8,
    marginTop: 12,
  },
  vehicleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleInput: {
    flex: 1,
    marginRight: 8,
  },
  vehicleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  icon: {
    marginLeft: 8,
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
});

export default CustomerFormScreen;