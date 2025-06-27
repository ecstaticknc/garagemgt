import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, Alert, ScrollView, TouchableOpacity, Modal, FlatList,
  Platform, KeyboardAvoidingView
} from 'react-native';
import {
  Appbar, TextInput, Button, ActivityIndicator, Text, List,
  Searchbar, RadioButton, Checkbox // Import Checkbox
} from 'react-native-paper';
import API from '../../../config/axiosInstance';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  SERVICE_TYPES
} from '../../../../utils/constants';
import moment from 'moment';

const ServiceHistoryFormScreen = () => {
  const navigation = useNavigation();
  const localSearchParams = useLocalSearchParams();
  const { userScId } = useAuth();

  const existingServiceHistory = localSearchParams?.serviceHistory ? JSON.parse(localSearchParams.serviceHistory) : null;
  const initialCustomerId = localSearchParams?.customerId || '';
  const customerDataFromParams = localSearchParams?.customerData ? JSON.parse(localSearchParams.customerData) : null;

  const [selectedBike, setSelectedBike] = useState(existingServiceHistory?.selectedBike || '');
  // Change selectedServices to an array for multiple selections
  const [selectedServices, setSelectedServices] = useState(
    existingServiceHistory?.selectedServices
      ? existingServiceHistory.selectedServices.split(',').map(s => s.trim())
      : []
  );
  const [miscellaneousServiceText, setMiscellaneousServiceText] = useState(
    existingServiceHistory?.selectedServices.includes('miscellaneous') ? existingServiceHistory?.serviceRemark : ''
  );
  const [serviceDate, setServiceDate] = useState(
    existingServiceHistory?.serviceDate ? existingServiceHistory.serviceDate.split('T')[0] : new Date().toISOString().split('T')[0]
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

  const initializedFromParams = React.useRef(false);

  useEffect(() => {
    if (initializedFromParams.current) return;

    if (customerDataFromParams) {
      setSelectedCustomer(customerDataFromParams);
      setCustomerId(customerDataFromParams.id.toString());
      const vehicles = customerDataFromParams.vehicles
        ? customerDataFromParams.vehicles.split(',').map(v => v.trim())
        : [];
      setCustomerVehicles(vehicles);
      setSelectedBike(existingServiceHistory?.selectedBike || '');
      initializedFromParams.current = true;
      return;
    }

    if (!existingServiceHistory || customers.length === 0) return;

    const matchId = String(existingServiceHistory.customerId);
    if (!selectedCustomer || String(selectedCustomer.id) !== matchId) {
      const matchedCustomer = customers.find(c => String(c.id) === matchId);
      if (matchedCustomer) {
        setSelectedCustomer(matchedCustomer);
        setCustomerId(String(matchedCustomer.id));
        const vehicles = matchedCustomer.vehicles
          ? matchedCustomer.vehicles.split(',').map(v => v.trim())
          : [];
        setCustomerVehicles(vehicles);
        setSelectedBike(existingServiceHistory.selectedBike || '');
         initializedFromParams.current = true;
      }
    }
  }, [customerDataFromParams, existingServiceHistory, customers]);

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
    const vehicles = customer.vehicles
      ? customer.vehicles.split(',').map(v => v.trim())
      : [];
    setCustomerVehicles(vehicles);
    setSelectedBike('');
  };

  const onDateChange = (event, selectedDate) => {
    const date = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setServiceDate(date.toISOString().split('T')[0]);
  };

  // Handle checkbox change
  const handleServiceCheckboxChange = (serviceId) => {
    setSelectedServices((prevSelectedServices) => {
      if (prevSelectedServices.includes(serviceId)) {
        return prevSelectedServices.filter((s) => s !== serviceId);
      } else {
        return [...prevSelectedServices, serviceId];
      }
    });
  };

  const handleSave = async () => {
    let finalRemark = serviceRemark;

    if (selectedServices.includes('miscellaneous')) {
      if (!miscellaneousServiceText.trim()) {
        Alert.alert('Validation Error', 'Miscellaneous details are required.');
        return;
      }
      finalRemark = miscellaneousServiceText;
    }

    if (!selectedBike || selectedServices.length === 0 || !serviceDate || !selectedCustomer) {
      Alert.alert('Validation Error', 'All required fields are needed. Please select at least one service type.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        selectedBike,
        selectedServices: selectedServices.join(', '), // Join array back to string for backend
        serviceDate,
        serviceRemark: finalRemark,
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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Customer Section */}
          {existingServiceHistory ? (
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyLabel}>Customer Name</Text>
              <Text style={styles.readOnlyValue}>
                {customerDataFromParams?.customerName || selectedCustomer?.customerName || 'N/A'}
              </Text>

              <Text style={styles.readOnlyLabel}>Mobile</Text>
              <Text style={styles.readOnlyValue}>
                {customerDataFromParams?.mobile || selectedCustomer?.mobile || 'N/A'}
              </Text>
              
            </View>
          ) : (
            <TouchableOpacity onPress={() => setShowCustomerPicker(true)} style={styles.input}>
              <TextInput
                label="Select Customer"
                value={selectedCustomer ? selectedCustomer.customerName : ''}
                mode="outlined"
                editable={false}
                right={<TextInput.Icon icon="chevron-down" />}
                style={styles.input}
              />
            </TouchableOpacity>
          )}

          {/* Vehicle Selection */}
          {selectedCustomer && customerVehicles.length > 0 && (
            <View style={styles.radioGroup}>
              <Text style={styles.radioGroupLabel}>Select Vehicle:</Text>
              <RadioButton.Group onValueChange={setSelectedBike} value={selectedBike}>
                {customerVehicles.map((v, i) => (
                  <View key={i} style={styles.radioItem}>
                    <RadioButton value={v} />
                    <Text>{v}</Text>
                  </View>
                ))}
              </RadioButton.Group>
            </View>
          )}

          {/* Date Picker */}
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
            <TextInput
              label="Service Date"
              value={moment(serviceDate).format('DD MMM YYYY')}
              mode="outlined"
              editable={false}
              right={<TextInput.Icon icon="calendar" />}
              style={styles.input}
            />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={serviceDate ? new Date(serviceDate) : new Date()}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}

          {/* Service Type Checkboxes */}
          <View style={styles.radioGroup}>
  <Text style={styles.radioGroupLabel}>Select Service Type:</Text>
{SERVICE_TYPES.map((service) => (
  <TouchableOpacity
    key={service.id}
    style={styles.checkboxItem}
    onPress={() => handleServiceCheckboxChange(service.id)}
    activeOpacity={0.7}
  >
    <View style={styles.checkboxWrapper}>
      <Checkbox
        status={selectedServices.includes(service.id) ? 'checked' : 'unchecked'}
        onPress={() => handleServiceCheckboxChange(service.id)}
        color="#6200ee"
        uncheckedColor="#888"
      />
    </View>
    <Text style={styles.checkboxLabel}>
      {service.label}
    </Text>
  </TouchableOpacity>
))}
</View>

          {/* Miscellaneous Input */}
          {selectedServices.includes('miscellaneous') && (
            <TextInput
              label="Miscellaneous Details"
              value={miscellaneousServiceText}
              onChangeText={setMiscellaneousServiceText}
              mode="outlined"
              multiline
              style={styles.input}
              placeholder="e.g. Brake fix, chain set"
            />
          )}

          <TextInput
            label="Service Remark (Optional)"
            value={serviceRemark}
            onChangeText={setServiceRemark}
            mode="outlined"
            multiline
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
            {existingServiceHistory ? 'Update' : 'Add'} Service Entry
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
  description={`Mobile: ${item.mobile || 'N/A'} | Vehicles: ${item.vehicles || 'N/A'}`}
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  button: { marginTop: 20, backgroundColor: '#6200ee', borderRadius: 8 },
  errorText: { color: 'red', textAlign: 'center', marginVertical: 10 },
  modalContent: { flex: 1, padding: 16 },
  searchBar: { marginBottom: 10 },
  radioGroup: { marginBottom: 12, padding: 12, backgroundColor: '#fff', borderRadius: 8 }, // Renamed to clarify its general use for grouping
  radioGroupLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  radioItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 }, // Renamed to clarify its general use for list items
  emptyList: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' },
  readOnlyBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  readOnlyLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 4,
  },
  readOnlyValue: {
    fontSize: 15,
    color: '#222',
  },
checkboxItem: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#fff',
  borderRadius: 8,
  paddingVertical: 10,
  paddingHorizontal: 12,
  marginBottom: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},
checkboxWrapper: {
  transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }],
},
checkboxLabel: {
  fontSize: 16,
  color: '#333',
  marginLeft: 12,
  flexShrink: 1,
},

});

export default ServiceHistoryFormScreen;