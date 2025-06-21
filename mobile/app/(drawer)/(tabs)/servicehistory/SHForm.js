import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Modal, FlatList, Platform,KeyboardAvoidingView } from 'react-native';
import { Appbar, TextInput, Button, ActivityIndicator, Text, List, Searchbar, RadioButton } from 'react-native-paper';
import API from '../../../config/axiosInstance'; // Adjusted path
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const ServiceHistoryFormScreen = () => {
  const navigation = useNavigation();
  const localSearchParams = useLocalSearchParams();
  const { userScId } = useAuth();

  const existingServiceHistory = localSearchParams?.serviceHistory ? JSON.parse(localSearchParams.serviceHistory) : null;
  const initialCustomerId = localSearchParams?.customerId || '';
  const customerDataFromParams = localSearchParams?.customerData ? JSON.parse(localSearchParams.customerData) : null;

  const [selectedBike, setSelectedBike] = useState(existingServiceHistory?.selectedBike || '');
  const [selectedServices, setSelectedServices] = useState(
    existingServiceHistory?.selectedServices
      ? Array.isArray(existingServiceHistory.selectedServices)
        ? existingServiceHistory.selectedServices
        : [existingServiceHistory.selectedServices]
      : []
  );
  const [miscellaneousServiceText, setMiscellaneousServiceText] = useState(
    existingServiceHistory?.selectedServices?.includes('miscellaneous') ? existingServiceHistory?.serviceRemark : ''
  );
  const [serviceDate, setServiceDate] = useState(
    existingServiceHistory?.serviceDate ? existingServiceHistory.serviceDate.split('T')[0] : ''
  );
  const [serviceRemark, setServiceRemark] = useState(existingServiceHistory?.serviceRemark || '');
  
  // State for customer selection
  const [customerId, setCustomerId] = useState(existingServiceHistory?.customerId ? String(existingServiceHistory.customerId) : initialCustomerId);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: existingServiceHistory ? 'Edit Service Entry' : 'Add Service Entry',
      headerShown: false,
    });
  }, [navigation, existingServiceHistory]);

  const fetchCustomers = useCallback(async () => {
    if (!userScId) {
      setError('Service Center ID not available.');
      setLoadingCustomers(false);
      return;
    }
    setLoadingCustomers(true);
    try {
      const response = await API._get(`/customers/by-sc?scId=${userScId}`);
      setCustomers(response.data.data);
      setFilteredCustomers(response.data.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      Alert.alert('Error', 'Failed to load customers.');
    } finally {
      setLoadingCustomers(false);
    }
  }, [userScId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // If editing, try to pre-select the customer and their vehicle
  useEffect(() => {
    if (existingServiceHistory && customers.length > 0) {
      const preSelected = customers.find(cust => String(cust.id) === String(existingServiceHistory.customerId));
      if (preSelected) {
        setSelectedCustomer(preSelected);
        if (preSelected.vehicles) {
          setCustomerVehicles(preSelected.vehicles.split(',').map(v => v.trim()));
        }
      }
    } else if (initialCustomerId && customers.length > 0) {
        // If coming from CustomerDetailScreen via FAB
        const preSelected = customers.find(cust => String(cust.id) === String(initialCustomerId));
        if (preSelected) {
            setSelectedCustomer(preSelected);
            setCustomerId(String(preSelected.id));
            if (preSelected.vehicles) {
              setCustomerVehicles(preSelected.vehicles.split(',').map(v => v.trim()));
            }
        }
    }
  }, [existingServiceHistory, customers, initialCustomerId, selectedCustomer]);

  // Filter customers based on search query
  useEffect(() => {
    if (customerSearchQuery) {
      const q = customerSearchQuery.toLowerCase();
      setFilteredCustomers(customers.filter(c =>
        c.customerName.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.vehicles && c.vehicles.toLowerCase().includes(q))
      ));
    } else {
      setFilteredCustomers(customers);
    }
  }, [customerSearchQuery, customers]);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerId(String(customer.id));
    setShowCustomerPicker(false);
    setCustomerSearchQuery(''); // Clear search query after selection
    if (customer.vehicles) {
      setCustomerVehicles(customer.vehicles.split(',').map(v => v.trim()));
      setSelectedBike(''); // Reset selected bike when customer changes
    } else {
      setCustomerVehicles([]);
      setSelectedBike('');
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios'); // For iOS, keeps picker open until confirmed
    setServiceDate(currentDate.toISOString().split('T')[0]);
  };

  const toggleServiceSelection = (serviceType) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceType)) {
        return prev.filter(item => item !== serviceType);
      } else {
        return [...prev, serviceType];
      }
    });
    
    if (serviceType === 'miscellaneous' && !selectedServices.includes('miscellaneous')) {
      setMiscellaneousServiceText('');
    }
  };

  const handleSave = async () => {
    let finalServiceRemark = serviceRemark;
    if (selectedServices === 'miscellaneous') {
      if (!miscellaneousServiceText.trim()) {
        Alert.alert('Validation Error', 'Miscellaneous service details are required.');
        return;
      }
      finalServiceRemark = miscellaneousServiceText; // Use the specific miscellaneous text for serviceRemark
    }

    if (!selectedBike.trim() || !selectedServices.trim() || !serviceDate.trim() || !selectedCustomer) {
      Alert.alert('Validation Error', 'Vehicle, Service Type, Service Date, and Customer are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        selectedBike,
        selectedServices,
        serviceDate,
        serviceRemark: finalServiceRemark, // Use the potentially updated serviceRemark
        customerId: parseInt(selectedCustomer.id), // Use the ID from the selected customer object
      };

      if (existingServiceHistory) {
        await API._put(`/servicehistory/${existingServiceHistory.id}`, payload);
        Alert.alert('Success', 'Service entry updated!');
      } else {
        await API._post('/servicehistory', payload);
        Alert.alert('Success', 'Service entry added!');
      }

      navigation.goBack();
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Failed to save entry.');
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
        <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Adjust behavior based on OS
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Customer Selection */}
        <TouchableOpacity onPress={() => setShowCustomerPicker(true)} style={styles.input}>
          <TextInput
            label="Select Customer"
            value={selectedCustomer ? `${selectedCustomer.customerName} ` : ''}
            mode="outlined"
            editable={false} // Make it read-only, opens picker on press
            right={<TextInput.Icon icon="chevron-down" />}
            style={styles.input}
          />
        </TouchableOpacity>

        {/* Vehicle Selection (Radio Buttons) */}
        {selectedCustomer && customerVehicles.length > 0 && (
          <View style={styles.radioGroup}>
            <Text style={styles.radioGroupLabel}>Select Vehicle:</Text>
            <RadioButton.Group onValueChange={newValue => setSelectedBike(newValue)} value={selectedBike}>
              {customerVehicles.map((vehicle, index) => (
                <View key={index} style={styles.radioItem}>
                  <RadioButton value={vehicle} />
                  <Text>{vehicle}</Text>
                </View>
              ))}
            </RadioButton.Group>
          </View>
        )}
        {selectedCustomer && customerVehicles.length === 0 && (
          <Text style={styles.infoText}>No vehicles found for this customer.</Text>
        )}

        {/* Service Date Picker */}
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
          <TextInput
            label="Service Date"
            value={serviceDate}
            mode="outlined"
            editable={false}
            right={<TextInput.Icon icon="calendar" />}
            style={styles.input}
          />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            testID="datePicker"
            value={serviceDate ? new Date(serviceDate) : new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {/* Service Types (Radio Buttons) */}
        <View style={styles.radioGroup}>
          <Text style={styles.radioGroupLabel}>Select Service Type:</Text>
          <RadioButton.Group onValueChange={newValue => {
            setSelectedServices(newValue);
            if (newValue !== 'miscellaneous') {
              setMiscellaneousServiceText(''); // Clear miscellaneous text if other option is selected
            }
          }} value={selectedServices}>
            <View style={styles.radioItem}>
              <RadioButton value="fullService" />
              <Text>Full Service</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="mediumService" />
              <Text>Medium Service</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="oilChange" />
              <Text>Oil Change</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="miscellaneous" />
              <Text>Miscellaneous</Text>
            </View>
          </RadioButton.Group>
        </View>

        {selectedServices === 'miscellaneous' && (
          <TextInput
            label="Miscellaneous Service Details"
            value={miscellaneousServiceText}
            onChangeText={setMiscellaneousServiceText}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder="e.g., Tire repair, headlight replacement"
          />
        )}

        <TextInput
          label="Service Remark (Optional)"
          value={serviceRemark}
          onChangeText={setServiceRemark}
          mode="outlined"
          multiline
          numberOfLines={3}
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
      </KeyboardAvoidingView>

      {/* Customer Picker Modal */}
      <Modal visible={showCustomerPicker} animationType="slide" onRequestClose={() => setShowCustomerPicker(false)}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => setShowCustomerPicker(false)} />
          <Appbar.Content title="Select Customer" />
        </Appbar.Header>
        <View style={styles.modalContent}>
          <Searchbar
            placeholder="Search by name, mobile or vehicle"
            value={customerSearchQuery}
            onChangeText={setCustomerSearchQuery}
            style={styles.searchBar}
          />
          {loadingCustomers ? (
            <ActivityIndicator animating size="large" />
          ) : (
            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <List.Item
                  title={item.customerName}
                  description={`Mobile: ${item.mobile} | Vehicles: ${item.vehicles || 'N/A'}`}
                  onPress={() => handleSelectCustomer(item)}
                  left={(props) => <List.Icon {...props} icon="account" />}
                />
              )}
              ListEmptyComponent={<Text style={styles.emptyList}>No customers found.</Text>}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light background for the whole screen
  },
 keyboardAvoidingView: {
    flex: 1, // Ensures the KeyboardAvoidingView takes up the full available space
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 150, // Increased padding to ensure content scrolls above the keyboard
    flexGrow: 1, // Allows the content container to grow and fill available space
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#ffffff', // White background for inputs
  },
  button: {
    marginTop: 20,
    marginBottom: 20, // Added margin to lift the button slightly
    backgroundColor: '#6200ee', // Material design primary color
    borderRadius: 8, // Slightly rounded buttons
    paddingVertical: 8,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  modalContent: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    marginBottom: 10,
    borderRadius: 8,
  },
  listItem: {
    backgroundColor: '#ffffff',
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
  radioGroup: {
    marginBottom: 12,
  },
  readOnlyLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  }
});

export default ServiceHistoryFormScreen;
