import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Linking,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Appbar } from 'react-native-paper';
import { useNavigation } from 'expo-router';
import API from '../../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/AuthContext';
import moment from 'moment';

const ReminderScreen = () => {
  const navigation = useNavigation();
  const [serviceHistory, setServiceHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const { userScId } = useAuth();

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
      setCustomers(response.data.data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      Alert.alert('Error', 'Failed to load customer list.');
    }
  };

  const fetchServiceHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API._get('/servicehistory');
      
      // Filter for services older than 3 months AND from 2024 only
      const now = moment();
      const threeMonthsAgo = moment().subtract(3, 'months');
      const startOf2024 = moment('2024-01-01');
      const endOf2024 = moment('2024-12-31');

      const filtered = response.data.data.filter(item => {
        if (!item.serviceDate) return false;
        
        const serviceDate = moment(item.serviceDate);
        return (
          serviceDate.isBefore(threeMonthsAgo) && // Older than 3 months
          serviceDate.isBetween(startOf2024, endOf2024, null, '[]') // Within 2024
        );
      });

      setServiceHistory(filtered);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Failed to load service reminders.');
      Alert.alert('Error', 'Could not fetch service reminders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServiceHistory();
    fetchCustomers();
  }, [fetchServiceHistory]);

  useEffect(() => {
    // Match service history with customer data
    if (serviceHistory.length > 0 && customers.length > 0) {
      const enrichedData = serviceHistory.map(service => {
        const customer = customers.find(c => c.id === service.customerId);
        return {
          ...service,
          customerName: customer?.customerName || 'Unknown Customer',
          customerMobile: customer?.mobile || ''
        };
      });
      setFilteredHistory(enrichedData);
    } else {
      setFilteredHistory(serviceHistory);
    }
  }, [serviceHistory, customers]);

  const handleSendReminder = (item) => {
    const mobile = item.customerMobile;
    const name = item.customerName;
    const formattedDate = item.serviceDate 
      ? moment(item.serviceDate).format('DD/MM/YYYY') 
      : 'N/A';

    if (!mobile) {
      Alert.alert('Error', 'Customer mobile number not available');
      return;
    }

    const whatsappMsg = `Hello ${name},\n\nThis is a friendly reminder for your ${item.selectedBike}. ` +
      `Your last service was on ${formattedDate}, which was more than 3 months ago. ` +
      `It's time to schedule your next service!\n\nThank you,\nYour Service Center`;

      

    const phoneWithCountryCode = `91${mobile.replace(/\D/g, '')}`;
    const url = `whatsapp://send?phone=${phoneWithCountryCode}&text=${encodeURIComponent(whatsappMsg)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp. Please make sure it is installed.');
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceTitle}>{item.selectedBike || 'Unknown Vehicle'}</Text>
        <Text style={styles.customerName}>{item.customerName}</Text>
      </View>
      
      <View style={styles.serviceDetails}>
        <Text style={styles.detailText}>
          📅 Last Service: {moment(item.serviceDate).format('DD MMM YYYY')}
        </Text>
        <Text style={styles.detailText}>
          🔧 Service Type: {item.selectedServices || 'Not specified'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.remindButton}
        onPress={() => handleSendReminder(item)}
      >
        <Text style={styles.remindButtonText}>📲 Send Reminder</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A8FE7" />
        <Text style={styles.loadingText}>Loading service reminders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchServiceHistory}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content 
          title="Service Reminders" 
          titleStyle={styles.headerTitle}
        />
        <Appbar.Action 
          icon="refresh" 
          onPress={() => {
            setRefreshing(true);
            fetchServiceHistory();
          }} 
        />
      </Appbar.Header>

      <FlatList
        data={filteredHistory}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={fetchServiceHistory}
            colors={['#4A8FE7']}
            tintColor="#4A8FE7"
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No service reminders needed for 2024</Text>
            <Text style={styles.emptyStateSubtext}>Services older than 3 months will appear here</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4A8FE7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4A8FE7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
  },
  customerName: {
    fontSize: 16,
    color: '#6B7280',
  },
  serviceDetails: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  remindButton: {
    backgroundColor: '#4A8FE7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remindButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 8,
  },
});

export default ReminderScreen;