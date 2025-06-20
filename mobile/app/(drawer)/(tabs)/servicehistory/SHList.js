// screens/ServiceHistory/ServiceHistoryListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Appbar, List, FAB, ActivityIndicator, Text, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import API from '../../../config/axiosInstance';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';

const ServiceHistoryListScreen = () => {
  const { user } = useAuth();
    const scId = user?.scId; // Get scId from auth context
    
  const navigation = useNavigation(); // Get navigation object from hook
  const localSearchParams = useLocalSearchParams(); // Get local search parameters

  // Parse customerId from local search params
  const customerId = localSearchParams?.customerId ? JSON.parse(localSearchParams.customerId) : null;

  // You need a way to get the scId (Service Center ID) of the logged-in user.
  // For demonstration, I'm hardcoding it. In a real app, this would come from
  // authentication context, a global state, or local storage after login.
  // For testing, make sure this matches an scId in your 'servicecenters' table
  // and associated with the customer you're testing.
  //const scId = 1; // ** IMPORTANT: Replace with actual scId from your application's state/context **

  const [customersWithHistory, setCustomersWithHistory] = useState([]);
    const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

 

  const fetchData = async () => {
        try {
            const response = await API._get(`/servicehistory/byServiceCenter?scId=${scId}`);
            setCustomersWithHistory(response.data.data);
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'Failed to fetch service history');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (scId) fetchData();
        }, [scId])
    );


  const handleDeleteServiceEntry = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this service entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              // This delete still uses the generic delete endpoint,
              // assuming your backend for /servicehistory/:id still exists and works.
              await API._delete(`/servicehistory/${id}`);
              Alert.alert('Success', 'Service entry deleted successfully!');
              fetchServiceHistory(); // Refresh the list
            } catch (err) {
              console.error('Error deleting service entry:', err);
              Alert.alert('Error', 'Failed to delete service entry.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" />
            ) : (
                <FlatList
                    data={customersWithHistory}
                    keyExtractor={(item) => item.customerId.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.customerCard}>
                            <Text style={styles.customerName}>{item.customerName}</Text>
                            <Text>Mobile: {item.mobile}</Text>
                            <Text>Vehicles: {item.vehicles}</Text>
                            
                            <FlatList
                                data={item.serviceHistory}
                                keyExtractor={(sh) => sh.id.toString()}
                                renderItem={({ item: sh }) => (
                                    <View style={styles.serviceCard}>
                                        <Text>Bike: {sh.selectedBike}</Text>
                                        <Text>Services: {sh.selectedServices}</Text>
                                        <Text>Date: {sh.serviceDate}</Text>
                                        <Text>Remarks: {sh.serviceRemark}</Text>
                                    </View>
                                )}
                            />
                        </View>
                    )}
                />
            )}
        </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 80,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

export default ServiceHistoryListScreen;