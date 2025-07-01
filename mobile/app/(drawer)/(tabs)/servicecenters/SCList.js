import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { Appbar, List, FAB, ActivityIndicator, Text, Button, TextInput } from 'react-native-paper'; // Import TextInput
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, useNavigation } from 'expo-router';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';

import API from '../../../config/axiosInstance';
import { useAuth } from '../../../../context/AuthContext';
import Pagination from '../../../../components/Pagination';

// Define a modern color palette
const COLORS = {
  primary: '#6B42F6',
  secondary: '#8A5DFE',
  accent: '#00C853',
  background: '#F0F2F5',
  text: '#344054',
  lightText: '#667085',
  cardBackground: '#FFFFFF',
  borderColor: '#E0E0E0',
  danger: '#FF3D00',
};

const CustomerListScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { userScId } = useAuth();

  const [allCustomers, setAllCustomers] = useState([]); // Stores all fetched customers
  const [displayedCustomers, setDisplayedCustomers] = useState([]); // Stores filtered and paginated customers
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false); // State for search bar visibility

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Changed from 5 to 10 items per page
  const [totalFilteredItems, setTotalFilteredItems] = useState(0);

  const fetchCustomers = async () => {
    if (!userScId) {
      setLoading(false);
      setError('Service Center ID is missing. Please log in again.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await API._get(`/customers/byServiceCenter?scId=${userScId}`);
      // Ensure each item has an 'id' for keyExtractor, filter out malformed data
      const validCustomers = (response.data.data || []).filter(item => item && item.id !== undefined && item.id !== null);
      setAllCustomers(validCustomers);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again.');
      Alert.alert('Error', 'Failed to load customers. Check your backend connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
      setCurrentPage(1); // Reset pagination on screen focus
      return () => {
        // Cleanup if necessary
      };
    }, [userScId]) // Depend on userScId if it can change
  );

  // Effect to filter and paginate customers whenever allCustomers, searchQuery, currentPage, or itemsPerPage changes
  useEffect(() => {
    let filteredData = allCustomers;

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filteredData = allCustomers.filter(customer =>
        customer.customerName?.toLowerCase().includes(lowerCaseQuery) ||
        customer.mobile?.includes(lowerCaseQuery) ||
        customer.vehicles?.toLowerCase().includes(lowerCaseQuery)
      );
    }

    setTotalFilteredItems(filteredData.length); // Update total filtered items count

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedCustomers(filteredData.slice(startIndex, endIndex));

    // If current page becomes empty after filter/pagination, go back to first page
    if (filteredData.slice(startIndex, endIndex).length === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [allCustomers, searchQuery, currentPage, itemsPerPage]);

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
              fetchCustomers(); // Refresh the list
            } catch (err) {
              console.error('Error deleting customer:', err);
              Alert.alert('Error', 'Failed to delete customer.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.customerCard}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => router.push({
          pathname: 'customers/CForm',
          params: { customer: JSON.stringify(item) }
        })}
      >
        <MaterialIcons name="person" size={24} color={COLORS.primary} style={styles.cardLeft} />
        <View style={styles.cardBody}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <View style={styles.customerDetail}>
            <MaterialIcons name="phone" size={14} color={COLORS.lightText} />
            <Text style={styles.customerDetailText}>{item.mobile}</Text>
          </View>
          {item.vehicles && (
            <View style={styles.customerDetail}>
              <MaterialIcons name="two-wheeler" size={14} color={COLORS.lightText} />
              <Text style={styles.customerDetailText}>{item.vehicles}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardActions}>
          <Button
            mode="text"
            onPress={() => handleDeleteCustomer(item.id)}
            labelStyle={{ color: COLORS.danger }}
            icon="delete"
          >
            {/* Delete */}
          </Button>
          <Button
            mode="text"
            onPress={() => router.push({
              pathname: 'customers/SHForm',
              params: { customerData: JSON.stringify(item), customerId: item.id }
            })}
            labelStyle={{ color: COLORS.primary }}
            icon="history"
          >
            {/* History */}
          </Button>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating={true} size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Customers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          mode="contained"
          onPress={fetchCustomers}
          style={{ backgroundColor: COLORS.primary }}
          labelStyle={{ color: COLORS.cardBackground }}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        {isSearchVisible ? (
          <>
            <Appbar.Action icon="arrow-left" color={COLORS.cardBackground} onPress={() => {
              setIsSearchVisible(false);
              setSearchQuery('');
            }} />
            <TextInput
              placeholder="Search customers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              underlineColor="transparent"
              selectionColor={COLORS.cardBackground + '99'}
              placeholderTextColor={COLORS.cardBackground + '99'}
              left={<TextInput.Icon icon="magnify" color={COLORS.cardBackground} style={styles.mangify} />}
              autoFocus
            />
            <Appbar.Action icon="close" color={COLORS.cardBackground} onPress={() => setSearchQuery('')} />
          </>
        ) : (
          <>
            <Appbar.Content title="Customers" titleStyle={styles.appBarTitle} />
            <Appbar.Action icon="magnify" color={COLORS.cardBackground} onPress={() => setIsSearchVisible(true)} />
          </>
        )}
      </Appbar.Header>

      <FlatList
        data={displayedCustomers}
        keyExtractor={(item, index) => (item && item.id) ? item.id.toString() : `fallback-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchCustomers}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          totalFilteredItems === 0 && searchQuery ? (
            <View style={styles.center}>
              <MaterialIcons name="search-off" size={48} color={COLORS.lightText} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyList}>No matching customers found for "{searchQuery}"</Text>
              <Button
                mode="outlined"
                onPress={() => setSearchQuery('')}
                labelStyle={{ color: COLORS.primary }}
                style={{ borderRadius: 8, marginTop: 10, borderColor: COLORS.primary }}
              >
                Clear Search
              </Button>
            </View>
          ) : (
            <View style={styles.center}>
              <MaterialIcons name="people-alt" size={48} color={COLORS.lightText} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyList}>No customers found.</Text>
            </View>
          )
        }
      />

      {!loading && !error && totalFilteredItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalFilteredItems}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => router.push('customers/CForm')}
        color={COLORS.cardBackground}
        backgroundColor={COLORS.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  appBar: {
    backgroundColor: COLORS.primary,
    height: 48,
    justifyContent: 'center',
    marginTop: -28,
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
  },
  appBarTitle: {
    color: COLORS.cardBackground,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    height: 38,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    color: COLORS.cardBackground,
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 17,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    paddingBottom: 90, // Increased padding to make space for the pagination component and FAB
  },
  customerCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    marginVertical: 4,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  cardLeft: {
    marginRight: 15,
  },
  cardBody: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  customerDetail: {
    fontSize: 14,
    color: COLORS.lightText,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  customerDetailText: {
    marginLeft: 5,
    color: COLORS.lightText,
  },
  cardActions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  fab: {
    position: 'absolute',
    margin: 10,
    right: 0,
    bottom: 80, // Adjusted FAB bottom to be above pagination
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: COLORS.lightText,
  },
   mangify: {
    marginTop: 8, // Adjusted margin for better alignment
    color: COLORS.cardBackground, // Ensure icon color matches the app bar
  },
});

export default CustomerListScreen;