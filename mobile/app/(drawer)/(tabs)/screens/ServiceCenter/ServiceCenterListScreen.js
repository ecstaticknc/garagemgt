// screens/ServiceCenter/ServiceCenterListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Appbar, List, FAB, ActivityIndicator, Text, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { _delete, _get } from '../../../../config/axiosInstance';

const ServiceCenterListScreen = ({ navigation }) => {
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchServiceCenters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await _get('/servicecenters');
      //console.log("first response", response.data);
      setServiceCenters(response.data.data);
    } catch (err) {
      console.error('Error fetching service centers:', err);
      setError('Failed to load service centers. Please try again.');
      Alert.alert('Error', 'Failed to load service centers. Check your backend connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchServiceCenters();
      return () => {
        // Cleanup if necessary
      };
    }, [])
  );

  const handleDeleteServiceCenter = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this service center?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await _delete(`/servicecenters/${id}`);
              Alert.alert('Success', 'Service Center deleted successfully!');
              fetchServiceCenters(); // Refresh the list
            } catch (err) {
              console.error('Error deleting service center:', err);
              Alert.alert('Error', 'Failed to delete service center.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <List.Item
      // Changed to use serviceCenterName from your backend data
      title={item.serviceCenterName}
      // Changed to use serviceCenterAddress and proprietorMobile from your backend data
      description={`Location: ${item.serviceCenterAddress} | Contact: ${item.proprietorMobile}`}
      left={props => <List.Icon {...props} icon="tools" />}
      right={props => (
        <View style={styles.actions}>
          <Button icon="pencil" onPress={() => navigation.navigate('ServiceCenterForm', { serviceCenter: item })} />
          <Button icon="delete" onPress={() => handleDeleteServiceCenter(item.id)} />
        </View>
      )}
      style={styles.listItem}
    />
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating={true} size="large" />
        <Text>Loading Service Centers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchServiceCenters}>Retry</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Service Centers" />
        <Appbar.Action icon="magnify" onPress={() => { /* Search functionality */ }} />
      </Appbar.Header>
      <FlatList
        data={serviceCenters}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchServiceCenters} />
        }
        ListEmptyComponent={<Text style={styles.emptyList}>No service centers found.</Text>}
      />
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('ServiceCenterForm')}
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

export default ServiceCenterListScreen;