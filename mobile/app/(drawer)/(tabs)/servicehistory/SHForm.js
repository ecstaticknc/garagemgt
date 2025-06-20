import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Modal, FlatList, Platform, KeyboardAvoidingView } from 'react-native';
import { Appbar, TextInput, Button, ActivityIndicator, Text, List, Searchbar } from 'react-native-paper';
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
      headerTitle: existingServiceHistory ? 'Edit Service Entry' : 'Add New Service Entry',
      headerShown: false,
    });
  }, [navigation, existingServiceHistory]);

  const fetchCustomers = useCallback(async () => {
    if (!userScId) {
      setError('Service Center ID not available. Cannot fetch customers.');
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
      setError('Failed to load customers for selection.');
      Alert.alert('Error', 'Failed to load customers for selection. Check backend.');
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
  }, [existingServiceHistory, customers, initialCustomerId]);

  useEffect(() => {
    if (customerSearchQuery) {
      const lowerCaseQuery = customerSearchQuery.toLowerCase();
      const filtered = customers.filter(
        (customer) =>
          customer.customerName.toLowerCase().includes(lowerCaseQuery) ||
          customer.mobile.includes(lowerCaseQuery) ||
          (customer.vehicles && customer.vehicles.toLowerCase().includes(lowerCaseQuery))
      );
      setFilteredCustomers(filtered);
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
      Alert.alert('Validation Error', 'Miscellaneous service details are required when selected.');
      return;
    }

    if (selectedServices.includes('miscellaneous')) {
      finalServiceRemark = miscellaneousServiceText;
    }

    if (!selectedBike.trim() || selectedServices.length === 0 || !serviceDate.trim() || !selectedCustomer) {
      Alert.alert('Validation Error', 'Vehicle, at least one Service Type, Service Date, and Customer are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const serviceHistoryData = {
        selectedBike,
        selectedServices,
        serviceDate,
        serviceRemark: finalServiceRemark,
        customerId: parseInt(selectedCustomer.id),
      };

      if (existingServiceHistory) {
        await API._put(`/servicehistory/${existingServiceHistory.id}`, serviceHistoryData);
        Alert.alert('Success', 'Service entry updated successfully!');
      } else {
        await API._post('/servicehistory', serviceHistoryData);
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

          {/* Vehicle Selection */}
          {selectedCustomer && customerVehicles.length > 0 && (
            <View style={styles.radioGroup}>
              <Text style={styles.radioGroupLabel}>Select Vehicle:</Text>
              {customerVehicles.map((vehicle, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.radioItem}
                  onPress={() => setSelectedBike(vehicle)}
                >
                  <View style={[
                    styles.radioButton,
                    selectedBike === vehicle && styles.radioButtonSelected
                  ]}>
                    {selectedBike === vehicle && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.radioLabel}>{vehicle}</Text>
                </TouchableOpacity>
              ))}
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
            
            {['fullService', 'mediumService', 'oilChange', 'miscellaneous'].map((serviceType) => (
              <TouchableOpacity 
                key={serviceType}
                style={styles.checkboxItem}
                onPress={() => toggleServiceSelection(serviceType)}
              >
                <View style={[
                  styles.checkbox,
                  selectedServices.includes(serviceType) && styles.checkboxSelected
                ]}>
                  {selectedServices.includes(serviceType) && <Text style={styles.checkboxIcon}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  {serviceType === 'fullService' && 'Full Service'}
                  {serviceType === 'mediumService' && 'Medium Service'}
                  {serviceType === 'oilChange' && 'Oil Change'}
                  {serviceType === 'miscellaneous' && 'Miscellaneous'}
                </Text>
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

      {/* Customer Selection Modal */}
      <Modal visible={showCustomerPicker} animationType="slide" onRequestClose={() => setShowCustomerPicker(false)}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => setShowCustomerPicker(false)} />
          <Appbar.Content title="Select Customer" />
        </Appbar.Header>
        <View style={styles.modalContent}>
          <Searchbar
            placeholder="Search Customer by Name, Mobile or Vehicle"
            onChangeText={setCustomerSearchQuery}
            value={customerSearchQuery}
            style={styles.searchBar}
          />
          {loadingCustomers ? (
            <ActivityIndicator animating={true} size="large" style={styles.center} />
          ) : error ? (
            <Text style={[styles.errorText, styles.center]}>{error}</Text>
          ) : (
            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <List.Item
                  title={item.customerName}
                  description={`Mobile: ${item.mobile || 'N/A'} | Vehicle: ${item.vehicles || 'N/A'}`}
                  left={props => <List.Icon {...props} icon="account" />}
                  onPress={() => handleSelectCustomer(item)}
                  style={styles.listItem}
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
  listItem: {
    backgroundColor: '#ffffff',
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
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
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  radioGroupLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: '#6200ee',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6200ee',
  },
  radioLabel: {
    fontSize: 15,
    color: '#333',
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
    padding: 16,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  checkboxGroupLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    fontWeight: '600',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: '#6200ee',
  },
  checkboxIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#333',
  },
});

export default ServiceHistoryFormScreen;