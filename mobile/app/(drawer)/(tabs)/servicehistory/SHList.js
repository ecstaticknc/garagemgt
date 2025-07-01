import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Appbar, List, FAB, ActivityIndicator, Text, Button, Card, Title, Paragraph, TextInput } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import API from '../../../config/axiosInstance';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import Pagination from '../../../../components/Pagination'; // Adjust path as needed

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

const ServiceHistoryListScreen = () => {
  const { userScId } = useAuth();
  const scId = userScId;
  const navigation = useNavigation();

  const [allCustomersWithHistory, setAllCustomersWithHistory] = useState([]); // Store all data
  const [customersWithHistory, setCustomersWithHistory] = useState([]); // Data to display (after search/pagination)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // You can make this configurable
  const [totalFilteredItems, setTotalFilteredItems] = useState(0); // New state to store count of items after search filter

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

      const filtered = data.filter(customer =>
        customer.serviceHistory && customer.serviceHistory.length > 0
      );
      setAllCustomersWithHistory(filtered); // Store all fetched data
    } catch (err) {
      console.error('Error fetching service history:', err);
      setError(err.response?.data?.message || 'Failed to fetch service history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (scId) fetchData();
      else setLoading(false);
      // Reset pagination and expanded customer when screen focuses
      setCurrentPage(1);
      setExpandedCustomer(null);
    }, [scId])
  );

  const handleDeleteServiceEntry = async (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this service entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await API._delete(`/servicehistory/${id}`);
            Alert.alert('Success', 'Service entry deleted successfully!');
            fetchData(); // Re-fetch data after deletion
          } catch (err) {
            console.error('Delete error:', err);
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete service entry.');
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
        customerData: JSON.stringify(serviceEntry.customerData)
      }
    });
  };

  // Filter and paginate data
  useEffect(() => {
    let filteredData = allCustomersWithHistory;

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filteredData = allCustomersWithHistory.filter(customer => {
        const customerMatches =
          customer.customerName?.toLowerCase().includes(lowerCaseQuery) ||
          customer.mobile?.includes(lowerCaseQuery) ||
          customer.vehicles?.toLowerCase().includes(lowerCaseQuery);

        if (customer.serviceHistory && customer.serviceHistory.length > 0) {
          const serviceHistoryMatches = customer.serviceHistory.some(sh =>
            sh.selectedBike?.toLowerCase().includes(lowerCaseQuery) ||
            sh.selectedServices?.toLowerCase().includes(lowerCaseQuery) ||
            sh.serviceRemark?.toLowerCase().includes(lowerCaseQuery) ||
            (sh.lastKM && String(sh.lastKM).includes(lowerCaseQuery))
          );
          return customerMatches || serviceHistoryMatches;
        }
        return customerMatches;
      });
    }

    setTotalFilteredItems(filteredData.length); // Update total filtered items count

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setCustomersWithHistory(filteredData.slice(startIndex, endIndex));

    // If current page becomes empty after filter/pagination, go back to first page
    if (filteredData.slice(startIndex, endIndex).length === 0 && currentPage > 1) {
      setCurrentPage(1);
    }

  }, [allCustomersWithHistory, searchQuery, currentPage, itemsPerPage]);


  const handleAccordionPress = (customerId) => {
    setExpandedCustomer(prev => (prev === customerId ? null : customerId));
  };

  const renderCustomerItem = ({ item: customer }) => (
    <Card style={styles.customerCard}>
      <List.Accordion
        title={customer.customerName}
        description={`Mobile: ${customer.mobile || 'N/A'} | Vehicles: ${customer.vehicles || 'N/A'}`}
        left={props => <List.Icon {...props} icon="account" />}
        expanded={expandedCustomer === customer.customerId}
        onPress={() => handleAccordionPress(customer.customerId)}
        titleStyle={styles.accordionTitle}
        descriptionStyle={styles.accordionDescription}
        style={styles.accordionHeader}
        theme={{ colors: { primary: COLORS.primary } }}
      >
        <List.Section style={styles.accordionContentSection}>
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
              <Card style={styles.serviceCard}>
                <Card.Content>
                  <View style={styles.serviceHeader}>
                    <MaterialIcons name="calendar-today" size={18} color={COLORS.text} />
                    <Paragraph style={styles.serviceDate}>{moment(sh.serviceDate).format('DD MMMYYYY')}</Paragraph>
                  </View>

                  <View style={styles.serviceDetail}>
                    <MaterialIcons name="two-wheeler" size={16} color={COLORS.lightText} />
                    <Paragraph style={styles.serviceText}>{sh.selectedBike}</Paragraph>
                  </View>

                  {sh.lastKM && (
                    <View style={styles.serviceDetail}>
                      <MaterialIcons name="speed" size={16} color={COLORS.lightText} />
                      <Paragraph style={styles.serviceText}>Last KM: {sh.lastKM}</Paragraph>
                    </View>
                  )}

                  <View style={styles.serviceDetail}>
                    <MaterialIcons name="build" size={16} color={COLORS.lightText} />
                    <Paragraph style={styles.serviceText}>{sh.selectedServices}</Paragraph>
                  </View>

                  {sh.serviceRemark && (
                    <View style={styles.serviceDetail}>
                      <MaterialIcons name="notes" size={16} color={COLORS.lightText} />
                      <Paragraph style={styles.serviceText}>{sh.serviceRemark}</Paragraph>
                    </View>
                  )}

                  <View style={styles.serviceActions}>
                    <Button
                      mode="contained-tonal"
                      icon="pencil"
                      onPress={() => handleEditServiceEntry(sh)}
                      style={styles.editButton}
                      labelStyle={styles.buttonLabel}
                    >
                      Edit
                    </Button>
                    <Button
                      mode="contained-tonal"
                      icon="delete"
                      onPress={() => handleDeleteServiceEntry(sh.id)}
                      style={styles.deleteButton}
                      labelStyle={styles.buttonLabel}
                    >
                      Delete
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            )}
          />
        </List.Section>
      </List.Accordion>
    </Card>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(107, 66, 246, 0.05)', 'rgba(138, 168, 252, 0.28)']}
        style={StyleSheet.absoluteFill}
      />

      <Appbar.Header style={styles.header}>
        {isSearchVisible ? (
          <>
            <Appbar.Action icon="arrow-left" color={COLORS.card} onPress={() => {
              setIsSearchVisible(false);
              setSearchQuery('');
            }} />
            <TextInput
              placeholder="Search service history..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              underlineColor="transparent"
              selectionColor={COLORS.primary}
              placeholderTextColor={COLORS.card + '99'}
              left={<TextInput.Icon icon="magnify" color={COLORS.card} style={styles.mangify} />}
              autoFocus
            />
            <Appbar.Action icon="close" color={COLORS.card} onPress={() => setSearchQuery('')} />
          </>
        ) : (
          <>
            <Appbar.Content
              title="Service History"
              titleStyle={styles.headerTitle}
            />
            <Appbar.Action icon="magnify" color={COLORS.card} onPress={() => setIsSearchVisible(true)} />
          </>
        )}
      </Appbar.Header>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" animating={true} color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading service history...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            mode="contained"
            onPress={fetchData}
            style={styles.retryButton}
            labelStyle={styles.buttonLabel}
          >
            Try Again
          </Button>
        </View>
      ) : totalFilteredItems === 0 && searchQuery ? ( // Check totalFilteredItems for search empty state
        <View style={styles.center}>
          <MaterialIcons name="search-off" size={48} color={COLORS.lightText} />
          <Text style={styles.emptyList}>No matching service history found for "{searchQuery}"</Text>
          <Button
            mode="outlined"
            onPress={() => setSearchQuery('')}
            style={styles.refreshButton}
            labelStyle={{color: COLORS.primary}}
          >
            Clear Search
          </Button>
        </View>
      ) : allCustomersWithHistory.length === 0 ? ( // Check allCustomersWithHistory for overall empty state
        <View style={styles.center}>
          <MaterialIcons name="history" size={48} color={COLORS.lightText} />
          <Text style={styles.emptyList}>No service history found</Text>
          <Button
            mode="contained"
            onPress={fetchData}
            style={styles.refreshButton}
            labelStyle={styles.buttonLabel}
          >
            Refresh
          </Button>
        </View>
      ) : (
        <FlatList
          data={customersWithHistory} // Use paginated data here
          keyExtractor={(item) => item.customerId.toString()}
          renderItem={renderCustomerItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchData}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      {/* Pagination Component */}
      {!loading && !error && totalFilteredItems > 0 && ( // Use totalFilteredItems
        <Pagination
          currentPage={currentPage}
          totalItems={totalFilteredItems} // Pass the total filtered items count
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => {
            setCurrentPage(page);
            setExpandedCustomer(null); // Collapse all accordions on page change
          }}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        label="नवीन सर्व्हिस नोंदणी"
        onPress={() => navigation.navigate('SHForm')}
        color={COLORS.card}
        mode="flat"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    height: 48,
    marginTop: -28,
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
  },
  headerTitle: {
    fontSize: 20,
    marginLeft: 10,
    fontWeight: 'bold',
    color: COLORS.card,
  },
  searchInput: {
    flex: 1,
    height: 35,
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
    marginTop: 16,
    color: COLORS.text,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.danger,
    marginVertical: 16,
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
  emptyList: {
    color: COLORS.lightText,
    marginVertical: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 90, // Make space for the pagination component
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  customerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  accordionHeader: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 0,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  accordionDescription: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  accordionContentSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  serviceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    elevation: 0,
    borderRightWidth: 4,
    borderRightColor: COLORS.primary,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceDate: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginLeft: 8,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  serviceText: {
    color: COLORS.text,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  serviceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderRadius: 6,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    marginTop: 8,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    marginTop: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 10,
    right: 0,
    bottom: 80, // Adjusted FAB bottom to be above pagination
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    elevation: 4,
  },
    mangify: {
    marginTop: 8, // Adjusted margin for better alignment
    color: COLORS.cardBackground, // Ensure icon color matches the app bar
  },
});

export default ServiceHistoryListScreen;