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
  Platform, // Import Platform to check OS
} from 'react-native';
import { Appbar } from 'react-native-paper';
import { useNavigation } from 'expo-router';
import API from '../../config/axiosInstance';
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

  // const fetchCustomers = async () => {
  //   if (!userScId) {
  //     setLoading(false);
  //     setError('User service center ID not available. Please log in again.');
  //     return;
  //   }
  //   setError(null);

  //   try {
  //     const response = await API._get(`/customers/by-sc?scId=${userScId}`);
  //     console.log("customers in reminder", response.data.data);
  //     setCustomers(response.data.data);
  //   } catch (err) {
  //     console.error('Failed to fetch customers:', err);
  //     Alert.alert('Error', 'Failed to load customer list.');
  //     setError('Failed to load customer list.');
  //   }
  // };

  const fetchServiceHistory = useCallback(async () => {
    if (!userScId) {
      setLoading(false);
      setError('User service center ID not available. Please log in again.');
      setRefreshing(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await API._get(`/servicehistory/byServiceCenter?scId=${userScId}`);
      console.log("raw service history response", response.data.data);

      let allServiceHistory = [];
      response.data.data.forEach(customerData => {
        if (customerData.serviceHistory && Array.isArray(customerData.serviceHistory)) {
          const serviceHistoryWithCustomerInfo = customerData.serviceHistory.map(service => ({
            ...service,
            customerId: customerData.customerId,
            customerName: customerData.customerName,
            customerMobile: customerData.mobile,
          }));
          allServiceHistory = allServiceHistory.concat(serviceHistoryWithCustomerInfo);
        }
      });

      const now = moment();
      const threeMonthsAgo = now.subtract(3, 'months');
      // const threeMonthsAgo = moment().subtract(3, 'months');
      // const startOf2024 = moment('2024-01-01');
      // const endOf2024 = moment('2024-12-31').endOf('day');

      const startOfCurrentYear = moment().startOf('year');
const endOfCurrentYear = moment().endOf('year');  

      const filtered = allServiceHistory.filter(item => {
        if (!item.serviceDate) return false;

        const serviceDate = moment(item.serviceDate);
        return (
          serviceDate.isBefore(threeMonthsAgo) &&
          serviceDate.isBetween(startOfCurrentYear, endOfCurrentYear, null, '[]')
          // serviceDate.isBetween(startOf2024, endOf2024, null, '[]')
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
  }, [userScId]);

  useEffect(() => {
    if (userScId) {
      fetchServiceHistory();
      //fetchCustomers();
    }
  }, [userScId, fetchServiceHistory]);

  useEffect(() => {
    setFilteredHistory(serviceHistory);
  }, [serviceHistory]);


  const handleSendReminder = async (item) => { // Made async to use await with Linking.canOpenURL
    const mobile = item.customerMobile;
    const name = item.customerName;
    const formattedDate = item.serviceDate
      ? moment(item.serviceDate).format('DD/MM/YYYY')
      : 'N/A';

    if (!mobile) {
      Alert.alert('Error', 'Customer mobile number not available');
      return;
    }

    const whatsappMsg = `👋 Dear Customer, *${customerName}*\n\n` +
    `This is a friendly reminder from *${selectedSCName}* that it's time to service your 🏍️ Vehicle No. *${vehicleNumber}*. ` +
    `It has been over 3 months since your last service on ${formattedDate}, and we recommend scheduling a maintenance appointment to keep your vehicle running smoothly.\n\n` +
    `🔹 If you have any questions or would like to book a service, please feel free to contact us at *${proprietorMobile}*. ` +
    `We look forward to assisting you.\n\n` +
    `Best regards, *${selectedSCName}*\n` +
    `📲 *${proprietorMobile}*\n\n\n` +
    
    `👋 आदरणीय ग्राहक, *${customerName}*\n\n` +
    `🔹 *${selectedSCName}* कडून आपल्याला एक सौम्य आठवण देत आहोत की आपल्या वाहनाची 🏍️ *${vehicleNumber}* ची सर्विस करण्याची वेळ झाली आहे. ` +
    `आपल्या वाहनाची शेवटची सर्विस ${formattedDate} रोजी झाली होती, आणि ३ महिन्यांपेक्षा जास्त काळ झाला आहे. ` +
    `आम्ही आपल्याला वाहनाची देखभाल करण्याचा सल्ला देतो.\n\n` +
    `🔹 आपल्याला काही प्रश्न असल्यास किंवा सेवा बुक करायची असल्यास, कृपया आमच्याशी संपर्क साधा: *${proprietorMobile}*.\n` +
    `🔹 आम्ही आपली सेवा करण्यास उत्सुक आहोत.\n\n` +
    `धन्यवाद,\n` +
    `*${selectedSCName}*\n\n` +
    `कृपया मोकळ्या मनाने माझ्याशी संपर्क साधा 😊\n` +
    `📲 *${proprietorMobile}*`;


    const phoneWithCountryCode = `91${mobile.replace(/\D/g, '')}`; // Assuming +91 for India

    // 1. Try to open WhatsApp
    const whatsappUrl = `whatsapp://send?phone=${phoneWithCountryCode}&text=${encodeURIComponent(whatsappMsg)}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        // If WhatsApp URL is not supported, try SMS
        Alert.alert(
          'WhatsApp Not Found',
          'WhatsApp is not installed or the number is not registered. Do you want to send an SMS instead?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Send SMS',
              onPress: () => sendSms(phoneWithCountryCode, whatsappMsg), // Use whatsappMsg for SMS
            },
          ],
          { cancelable: true }
        );
      }
    } catch (whatsappError) {
      console.error('Failed to open WhatsApp:', whatsappError);
      Alert.alert(
        'Error Opening WhatsApp',
        'Could not open WhatsApp. Do you want to send an SMS instead?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Send SMS',
            onPress: () => sendSms(phoneWithCountryCode, whatsappMsg),
          },
        ],
        { cancelable: true }
      );
    }
  };

  const sendSms = async (phoneNumber, message) => {
    let smsUrl;
    if (Platform.OS === 'android') {
      smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    } else { // iOS
      smsUrl = `sms:${phoneNumber}&body=${encodeURIComponent(message)}`;
    }

    try {
      const supported = await Linking.canOpenURL(smsUrl);
      if (supported) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('Error', 'Could not open SMS app on your device.');
      }
    } catch (smsError) {
      console.error('Failed to open SMS:', smsError);
      Alert.alert('Error', 'An unexpected error occurred while trying to send SMS.');
    }
  };


  const renderItem = ({ item }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>        
        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.serviceTitle}>{item.selectedBike || 'Unknown Vehicle'}</Text>
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
          onPress={() => {
            setLoading(true);
            fetchServiceHistory();
            //fetchCustomers();
          }}
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
            {/* <Text style={styles.emptyStateText}>No service reminders needed for 2024</Text> */}
            <Text style={styles.emptyStateSubtext}>Services older than 3 months will appear here from current date</Text>
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
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
  },
  serviceTitle: {
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