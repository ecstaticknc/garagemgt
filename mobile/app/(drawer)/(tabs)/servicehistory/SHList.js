// screens/ServiceHistory/ServiceHistoryListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Appbar, List, FAB, ActivityIndicator, Text, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import API from '../../../config/axiosInstance';
import { router, useLocalSearchParams, useNavigation } from 'expo-router'; 



const ServiceHistoryListScreen = () => {
  const navigation = useNavigation(); // Get navigation object from hook
    const localSearchParams = useLocalSearchParams(); // Get local search parameters
    const customerId = localSearchParams?.customerId ? JSON.parse(localSearchParams.customerId) : null;

 // const { customerId } = route.params || {}; // Get customerId if navigated from CustomerDetailScreen
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchServiceHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      // You might want to filter by customerId if provided
      const url = customerId ? `/servicehistory?customerId=${customerId}` : '/servicehistory';
      const response = await API._get(url);
      console.log("fiservicehistoryrst response", response.data.data);
      setServiceHistory(response.data.data);
    } catch (err) {
      console.error('Error fetching service history:', err);
      setError('Failed to load service history. Please try again.');
      Alert.alert('Error', 'Failed to load service history. Check your backend connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchServiceHistory();
      return () => {
        // Cleanup if necessary
      };
    }, [customerId]) // Re-run effect if customerId changes
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
    <List.Item
      // Changed to use selectedBike from your backend data
      title={`Vehicle: ${item.selectedBike}`}
      // Changed to use selectedServices from your backend data
      description={`Date: ${item.serviceDate ? item.serviceDate.split('T')[0] : 'N/A'} | Services: ${item.selectedServices}`}
      left={props => <List.Icon {...props} icon="calendar-check" />}
      right={props => (
        <View style={styles.actions}>        
             <Button icon="pencil" onPress={() => router.push({
                pathname: 'servicehistory/SHForm',
                params: { serviceHistory: JSON.stringify(item), customerId: customerId } // Pass the service
             })} />
          <Button icon="delete" onPress={() => handleDeleteServiceEntry(item.id)} />
        </View>
      )}
      style={styles.listItem}
    />
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating={true} size="large" />
        <Text>Loading Service History...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchServiceHistory}>Retry</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        {customerId && <Appbar.BackAction onPress={() => navigation.goBack()} />}
        <Appbar.Content title={customerId ? "Customer Service History" : "Service History"} />
        <Appbar.Action icon="magnify" onPress={() => { /* Search functionality */ }} />
      </Appbar.Header>
      <FlatList
        data={serviceHistory}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchServiceHistory} />
        }
        ListEmptyComponent={<Text style={styles.emptyList}>No service history found.</Text>}
      />
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('SHForm', { customerId: customerId })} // Pass customerId if applicable
      />
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