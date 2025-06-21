import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Modal, FlatList, Platform, KeyboardAvoidingView } from 'react-native';
import { Appbar, TextInput, Button, ActivityIndicator, Text, List, Searchbar, RadioButton,Checkbox } from 'react-native-paper';
import API from '../../../config/axiosInstance';
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

  // Service types data
  const serviceTypes = [
    { id: 'fullService', label: 'Full Service' },
    { id: 'mediumService', label: 'Medium Service' },
    { id: 'oilChange', label: 'Oil Change' },
    { id: 'miscellaneous', label: 'Miscellaneous' }
  ];

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
    setCustomerSearchQuery('');
    if (customer.vehicles) {
      setCustomerVehicles(customer.vehicles.split(',').map(v => v.trim()));
      setSelectedBike('');
    } else {
      setCustomerVehicles([]);
      setSelectedBike('');
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
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
    
    // Check if miscellaneous is selected but no text provided
    if (selectedServices.includes('miscellaneous') && !miscellaneousServiceText.trim()) {
      Alert.alert('Validation Error', 'Miscellaneous service details are required.');
      return;
    }

    if (!selectedBike.trim() || selectedServices.length === 0 || !serviceDate.trim() || !selectedCustomer) {
      Alert.alert('Validation Error', 'Vehicle, Service Type, Service Date, and Customer are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        selectedBike,
        selectedServices,
        serviceDate,
        serviceRemark: selectedServices.includes('miscellaneous') ? miscellaneousServiceText : finalServiceRemark,
        customerId: parseInt(selectedCustomer.id),
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Customer Selection */}
          <TouchableOpacity onPress={() => setShowCustomerPicker(true)} style={styles.input}>
            <TextInput
              label="Select Customer"
              value={selectedCustomer ? `${selectedCustomer.customerName} ` : ''}
              mode="outlined"
              editable={false}
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

          {/* Service Types (Checkboxes) */}
          <View style={styles.checkboxGroup}>
            <Text style={styles.checkboxGroupLabel}>Select Service Types:</Text>
            {serviceTypes.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.checkboxItem}
                onPress={() => toggleServiceSelection(service.id)}
              >
                <View style={styles.checkboxContainer}>
                  <Checkbox
                    status={selectedServices.includes(service.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleServiceSelection(service.id)}
                    color="#6200ee"
                  />
                  <Text style={styles.checkboxLabel}>{service.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {selectedServices.includes('miscellaneous') && (
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
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 150,
    flexGrow: 1,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  button: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#6200ee',
    borderRadius: 8,
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
  emptyList: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
  radioGroup: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
  },
  radioGroupLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
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
  },
  checkboxGroup: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
  },
  checkboxGroupLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  checkboxItem: {
    marginVertical: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
});

export default ServiceHistoryFormScreen;