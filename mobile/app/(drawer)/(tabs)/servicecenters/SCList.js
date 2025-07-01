// screens/ServiceCenter/ServiceCenterListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Appbar, List, FAB, ActivityIndicator, Text, Button, TextInput } from 'react-native-paper'; // Import TextInput
import { useFocusEffect } from '@react-navigation/native';
import API from '../../../config/axiosInstance';
import { router, useLocalSearchParams, useNavigation } from 'expo-router'; 
import { MaterialIcons } from '@expo/vector-icons'; // Import MaterialIcons for search icon
import Pagination from '../../../../components/Pagination'; // Import Pagination component

// Define a modern color palette consistent with CList.js and SHList.js
const COLORS = {
  primary: '#6B42F6', 
  secondary: '#8A5DFE', 
  accent: '#FFD700',   
  background: '#F8FAFC', 
  text: '#344054',      
  lightText: '#667085', 
  card: '#FFFFFF', 
  border: '#EAECF0', 
  danger: '#F04438',    
  success: '#12B76A',
  warning: '#F79009',
  info: '#06AED4',
};

const ServiceCenterListScreen = () => {
   const navigation = useNavigation(); 
   const localSearchParams = useLocalSearchParams(); 
   const customerId = localSearchParams?.customerId ? JSON.parse(localSearchParams.customerId) : null;

  const [allServiceCenters, setAllServiceCenters] = useState([]); // Stores all fetched service centers
  const [displayedServiceCenters, setDisplayedServiceCenters] = useState([]); // Stores filtered and paginated service centers
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [isSearchVisible, setIsSearchVisible] = useState(false); // State for search bar visibility

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // You can make this configurable
  const [totalFilteredItems, setTotalFilteredItems] = useState(0); // New state for total filtered items after search

  const fetchServiceCenters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API._get('/servicecenters');
      setAllServiceCenters(response.data.data); // Store all fetched service centers
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
      setCurrentPage(1); // Reset pagination on screen focus
      return () => {
        // Cleanup if necessary
      };
    }, [])
  );

  // Effect to filter and paginate service centers whenever allServiceCenters, searchQuery, currentPage, or itemsPerPage changes
  useEffect(() => {    
      let filteredData = allServiceCenters;

      if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        filteredData = allServiceCenters.filter(serviceCenter =>
          serviceCenter.serviceCenterName?.toLowerCase().includes(lowerCaseQuery) ||
          serviceCenter.serviceCenterAddress?.toLowerCase().includes(lowerCaseQuery) ||
          serviceCenter.proprietorMobile?.includes(lowerCaseQuery)
        );
      }

      setTotalFilteredItems(filteredData.length); // Update total filtered items count

      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setDisplayedServiceCenters(filteredData.slice(startIndex, endIndex));

      // If current page becomes empty after filter/pagination, go back to first page
      if (filteredData.slice(startIndex, endIndex).length === 0 && currentPage > 1) {
        setCurrentPage(1);
      }
    }, [allServiceCenters, searchQuery, currentPage, itemsPerPage]);


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
              await API._delete(`/servicecenters/${id}`);
              Alert.alert('Success', 'Service Center deleted successfully!');
              fetchServiceCenters(); // Refresh the list
            } catch (err) {
              console.error('Error deleting service center:', err);
              Alert.alert('Error', 'Failed to delete service center.');
            }
          },
          style: 'destructive', 
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <List.Item
      title={item.serviceCenterName}
      description={`Location: ${item.serviceCenterAddress || 'N/A'} | Contact: ${item.proprietorMobile || 'N/A'}`}
      left={props => <List.Icon {...props} icon="tools" color={COLORS.primary} />}
      right={props => (
        <View style={styles.actions}>
             <Button icon="pencil" onPress={() => router.push({
                pathname: 'servicecenters/SCForm',
                params: { serviceCenter: JSON.stringify(item) } 
             })} 
             labelStyle={{color: COLORS.primary}} 
             />
          <Button icon="delete" onPress={() => handleDeleteServiceCenter(item.id)} 
             labelStyle={{color: COLORS.danger}}
          />
        </View>
      )}
      style={styles.listItem}
      titleStyle={styles.listItemTitle}
      descriptionStyle={styles.listItemDescription}
    />
  );

  if (loading && !refreshing) { 
    return (
      <View style={styles.center}>
        <ActivityIndicator animating={true} size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Service Centers...</Text>
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
          onPress={fetchServiceCenters}
          style={{backgroundColor: COLORS.primary}} 
          labelStyle={{color: COLORS.card}} 
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
            <Appbar.Action icon="arrow-left" color={COLORS.card} onPress={() => {
              setIsSearchVisible(false);
              setSearchQuery(''); 
            }} />
            <TextInput
              placeholder="Search service centers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput} 
              underlineColor="transparent"
              selectionColor={COLORS.card} 
              placeholderTextColor={COLORS.card + '99'}
              left={<TextInput.Icon icon="magnify" color={COLORS.card} />}
              autoFocus 
            />
            <Appbar.Action icon="close" color={COLORS.card} onPress={() => setSearchQuery('')} /> 
          </>
        ) : (
          <>
            <Appbar.Content title="Service Centers" titleStyle={styles.appBarTitle} /> 
            <Appbar.Action icon="magnify" color={COLORS.card} onPress={() => setIsSearchVisible(true)} /> 
          </>
        )}
      </Appbar.Header>

      <FlatList
        data={displayedServiceCenters} 
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={fetchServiceCenters} 
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          totalFilteredItems === 0 && searchQuery ? ( 
            <View style={styles.center}>
              <MaterialIcons name="search-off" size={48} color={COLORS.lightText} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyList}>No matching service centers found for "{searchQuery}"</Text>
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
              <MaterialIcons name="store" size={48} color={COLORS.lightText} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyList}>No service centers found.</Text>
            </View>
          )
        }
      />
      
      {/* Pagination Component */}
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
        onPress={() => navigation.navigate('SCForm')}
        color={COLORS.card} 
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
    marginTop: -48, 
  },
  appBarTitle: {
    color: COLORS.card, 
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
    color: COLORS.card, 
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
    paddingBottom: 90,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border, 
    backgroundColor: COLORS.card, 
    borderRadius: 8,
    marginVertical: 4,
    elevation: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  listItemDescription: {
    fontSize: 13,
    color: COLORS.lightText,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 24, 
    right: 0,
    bottom: 80,
    backgroundColor: COLORS.primary,
    borderRadius: 50, 
    elevation: 4,
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: COLORS.lightText,
  },
});

export default ServiceCenterListScreen;