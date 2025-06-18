// screens/Customer/CustomerFormScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, Platform, Pressable } from 'react-native'; // Import Pressable for custom button area
import { Appbar, TextInput, Button, ActivityIndicator, Text } from 'react-native-paper';
import API from '../../../config/axiosInstance';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker'; // Import DateTimePicker

const CustomerFormScreen = () => {
  const navigation = useNavigation();
  const localSearchParams = useLocalSearchParams();
  const existingCustomer = localSearchParams?.customer ? JSON.parse(localSearchParams.customer) : null;

  const { userScId } = useAuth();

  const [customerName, setCustomerName] = useState(existingCustomer?.customerName || '');
  const [mobile, setMobile] = useState(existingCustomer?.mobile || '');
  const [vehicles, setVehicles] = useState(() => {
    if (existingCustomer?.vehicles) {
      return existingCustomer.vehicles.split(',').map(item => item.trim());
    }
    return [''];
  });

  // State for the date picker
  const [showPicker, setShowPicker] = useState(false);
  const [regDate, setRegDate] = useState(existingCustomer?.regDate ? existingCustomer.regDate.split('T')[0] : ''); // YYYY-MM-DD string
  const [dateObject, setDateObject] = useState(existingCustomer?.regDate ? new Date(existingCustomer.regDate) : new Date()); // Date object for picker

  const [scId, setScId] = useState(existingCustomer?.scId ? String(existingCustomer.scId) : (userScId ? String(userScId) : ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: existingCustomer ? 'Edit Customer' : 'Add New Customer',
      headerShown: false,
    });
  }, [navigation, existingCustomer]);

  const handleAddVehicle = () => {
    setVehicles([...vehicles, '']);
  };

  const handleRemoveVehicle = (index) => {
    Alert.alert(
      "Remove Vehicle",
      "Are you sure you want to remove this vehicle?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          onPress: () => {
            const newVehicles = vehicles.filter((_, i) => i !== index);
            setVehicles(newVehicles.length > 0 ? newVehicles : ['']);
          }
        }
      ]
    );
  };

  const handleVehicleChange = (text, index) => {
    const newVehicles = [...vehicles];
    newVehicles[index] = text;
    setVehicles(newVehicles);
  };

  // Date picker event handler
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dateObject;
    setShowPicker(Platform.OS === 'ios'); // Hide picker on iOS after selection
    setDateObject(currentDate); // Update the Date object state
    setRegDate(currentDate.toISOString().split('T')[0]); // Format to YYYY-MM-DD
  };

  const showDatePicker = () => {
    setShowPicker(true);
  };

  const handleSave = async () => {
    if (!customerName.trim() || !mobile.trim()) {
      Alert.alert('Validation Error', 'Customer Name and Mobile are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const vehiclesToSave = vehicles.filter(v => v.trim() !== '').join(', ');

      const customerData = {
        customerName,
        mobile,
        vehicles: vehiclesToSave,
        regDate: regDate, // Use the YYYY-MM-DD string
        scId: existingCustomer?.scId ? parseInt(existingCustomer.scId) : (userScId ? parseInt(userScId) : null)
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

        <Text style={styles.sectionTitle}>Vehicles</Text>
        {vehicles.map((vehicle, index) => (
          <View key={index} style={styles.vehicleInputContainer}>
            <TextInput
              label={`Vehicle ${index + 1}`}
              value={vehicle}
              onChangeText={(text) => handleVehicleChange(text, index)}
              mode="outlined"
              style={styles.vehicleInput}
            />
            {vehicles.length > 1 && (
              <Button
                icon="minus-circle-outline"
                mode="text"
                onPress={() => handleRemoveVehicle(index)}
                style={styles.removeButton}
                labelStyle={styles.removeButtonLabel}
              />
            )}
          </View>
        ))}
        <Button
          icon="plus-circle-outline"
          mode="outlined"
          onPress={handleAddVehicle}
          style={styles.addVehicleButton}
        >
          Add Another Vehicle
        </Button>

        {/* Date Picker Integration */}
        <Pressable onPress={showDatePicker}>
          <TextInput
            label="Registration Date (YYYY-MM-DD)"
            value={regDate}
            mode="outlined"
            placeholder="Tap to select date"
            editable={false} // Make it non-editable
            style={styles.input}
            right={<TextInput.Icon icon="calendar" onPress={showDatePicker} />} // Calendar icon
          />
        </Pressable>
        {showPicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={dateObject} // Use the Date object for the picker
            mode={'date'}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'} // 'spinner' for iOS, 'default' for Android
            onChange={onDateChange}
          />
        )}
        {/* End Date Picker Integration */}

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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  vehicleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleInput: {
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    minWidth: 40,
  },
  removeButtonLabel: {
    fontSize: 20,
    color: 'red',
  },
  addVehicleButton: {
    marginTop: 5,
    marginBottom: 15,
    borderColor: '#6200ee',
  },
});

export default CustomerFormScreen;