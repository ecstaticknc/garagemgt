// screens/Customer/CustomerListScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Appbar, List, FAB, ActivityIndicator, Text, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import API from '../../../config/axiosInstance';
import { useRouter, useNavigation } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';

const CustomerListScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { userScId } = useAuth();

  console.log("User Service Center ID:", userScId);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomers = async () => {
    if (!userScId) {
      setLoading(false);
      setError('User service center ID not available. Please log in again.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await API._get(`/customers/by-sc?scId=${userScId}`);
      console.log("Fetched Customers:", response.data.data.length);
      setCustomers(response.data.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again.');
      Alert.alert('Error', 'Failed to load customers. Check your backend connection and login status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
      return () => {};
    }, [userScId])
  );

  const handleDeleteCustomer = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await API._delete(`/customers/${id}`);
              Alert.alert('Success', 'Customer deleted successfully!');
              fetchCustomers();
            } catch (err) {
              console.error('Error deleting customer:', err);
              Alert.alert('Error', 'Failed to delete customer.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <List.Item
      title={item.customerName}
      description={`Mobile: ${item.mobile} | Vehicle: ${item.vehicles || 'N/A'}`}
      left={props => <List.Icon {...props} icon="account" />}
      right={() => (
        <View style={styles.actions}>
          <Button icon="pencil" onPress={() => router.push({
                pathname: '/customers/CForm',
                params: { customer: JSON.stringify(item) },
              })} />
          <Button icon="delete" onPress={() => handleDeleteCustomer(item.id)} />
        </View>
      )}
      onPress={() => navigation.navigate('CDetail', { customerId: item.id })}
      style={styles.listItem}
    />
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating={true} size="large" />
        <Text>Loading Customers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchCustomers}>Retry</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Customers" />
        <Appbar.Action icon="magnify" onPress={() => { /* Search functionality */ }} />
      </Appbar.Header>
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchCustomers} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyList}>No customers found for this service center.</Text>
          </View>
        }
      />
      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Customer"
        onPress={() => navigation.navigate('CForm')}
        color="#fff"
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
    borderRadius: 30,
    elevation: 6,
    
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

export default CustomerListScreen;