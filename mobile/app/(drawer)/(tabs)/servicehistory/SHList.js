// SHList.js (ServiceHistoryListScreen.js)
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Appbar, List, FAB, ActivityIndicator, Text, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import API from '../../../config/axiosInstance';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';

const ServiceHistoryListScreen = () => {
  const { userScId } = useAuth();
  const scId = userScId; // fallback to 2 for testing
console.log("user scId", userScId)
  const navigation = useNavigation();
  //const localSearchParams = useLocalSearchParams();

  // const customerId = localSearchParams?.customerId
  //   ? JSON.parse(localSearchParams.customerId)
  //   : null;

  const [customersWithHistory, setCustomersWithHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      if (!scId) {
        Alert.alert('Error', 'Service Center ID is missing. Please log in again.');
        return;
      }

      const response = await API._get(`/servicehistory/byServiceCenter?scId=${scId}`);
      const data = response.data?.data || [];
console.log("data in shlist", data)
      // Filter customers with service history
      const filtered = data.filter(customer =>
        customer.serviceHistory && customer.serviceHistory.length > 0
      );
      setCustomersWithHistory(filtered);
    } catch (err) {
      console.error('Error fetching service history:', err);
      setError(err.response?.data?.message || 'Failed to fetch service history.');
      Alert.alert('Error', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (scId) fetchData();
      else setLoading(false);
    }, [scId])
  );

  const handleDeleteServiceEntry = async (id) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await API._delete(`/servicehistory/${id}`);
            Alert.alert('Success', 'Entry deleted!');
            fetchData();
          } catch (err) {
            console.error('Delete error:', err);
            Alert.alert('Error', err.response?.data?.message || 'Delete failed.');
          }
        }
      }
    ]);
  };

  const handleEditServiceEntry = (serviceEntry) => {
    router.push({
       pathname: '/servicehistory/SHForm',
    params: {
      serviceHistory: JSON.stringify(serviceEntry),
      customerId: serviceEntry.customerId?.toString(),
      customerData: JSON.stringify(serviceEntry.customerData) // ✅ includes name, mobile, vehicles
    }
    });
  };

  const renderCustomerItem = ({ item: customer }) => (
    <View style={styles.customerCard}>
      <Text style={styles.customerName}>{customer.customerName}</Text>
      <Text>Mobile: {customer.mobile}</Text>
      <Text>Vehicles: {customer.vehicles}</Text>

      <FlatList
        data={customer.serviceHistory.map(sh => ({
    ...sh,
    customerData: {
      id: customer.customerId,
      customerName: customer.customerName,
      mobile: customer.mobile,
      vehicles: customer.vehicles
    }
  }))}
        keyExtractor={(sh) => sh.id.toString()}
        renderItem={({ item: sh }) => (
          <View style={styles.serviceCard}>
            <Text>Bike: {sh.selectedBike}</Text>
            <Text>Services: {sh.selectedServices}</Text>
            <Text>Date: {sh.serviceDate}</Text>
            <Text>Remarks: {sh.serviceRemark}</Text>

            <View style={styles.serviceActions}>
              <Button
                mode="outlined"
                icon="pencil"
                onPress={() => handleEditServiceEntry(sh)}
                compact
                style={styles.editButton}
                labelStyle={styles.editButtonLabel}
              >
                Edit
              </Button>
              <Button
                mode="outlined"
                icon="delete"
                onPress={() => handleDeleteServiceEntry(sh.id)}
                compact
                style={styles.deleteButton}
                labelStyle={styles.deleteButtonLabel}
              >
                Delete
              </Button>
            </View>
          </View>
        )}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Service History" />
      </Appbar.Header>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text>Loading service history...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={fetchData}>Retry</Button>
        </View>
      ) : customersWithHistory.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyList}>No service entries found.</Text>
          <Button mode="contained" onPress={fetchData}>Refresh</Button>
        </View>
      ) : (
        <FlatList
          data={customersWithHistory}
          keyExtractor={(item) => item.customerId.toString()}
          renderItem={renderCustomerItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Service"
        onPress={() => navigation.navigate('SHForm')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: 'red', marginBottom: 10, fontSize: 16, textAlign: 'center' },
  listContent: { paddingBottom: 80, paddingHorizontal: 10, paddingTop: 10 },
  customerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  customerName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  serviceCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
    marginBottom: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#6200ee',
    elevation: 1
  },
  serviceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 8
  },
  editButton: { borderColor: '#007bff', marginRight: 8 },
  editButtonLabel: { color: '#007bff' },
  deleteButton: { borderColor: '#dc3545' },
  deleteButtonLabel: { color: '#dc3545' },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
    zIndex: 1
  },
  emptyList: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' }
});

export default ServiceHistoryListScreen;
