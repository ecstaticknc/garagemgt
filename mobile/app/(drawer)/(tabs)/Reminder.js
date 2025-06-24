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
  Platform,
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
  const [serviceCenterInfo, setServiceCenterInfo] = useState(null);
  const { userScId } = useAuth();

  // Format vehicle number from exMh56ag7879 to MH-56-AG7879
  const formatVehicleNumber = (vehicleNumber) => {
    if (!vehicleNumber) return 'your vehicle';
    
    // Remove 'ex' prefix if present (case insensitive)
    const cleanedNumber = vehicleNumber.replace(/^ex/i, '');
    
    // Extract parts using regex
    const match = cleanedNumber.match(/^([a-z]{2})(\d{2})([a-z]{1,2})(\d{1,4})$/i);
    
    if (match) {
      const [, stateCode, district, series, number] = match;
      return `${stateCode.toUpperCase()}-${district}-${series.toUpperCase()}${number}`;
    }
    
    // Fallback for non-standard formats
    return cleanedNumber.toUpperCase();
  };

  const fetchServiceCenterInfo = useCallback(async () => {
    try {
      const response = await API._get(`/servicecenters/${userScId}`);
      setServiceCenterInfo(response.data.data);
    } catch (err) {
      console.error('Error fetching service center info:', err);
    }
  }, [userScId]);

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
      
      let allServiceHistory = []; 
      response.data.data.forEach(customerData => {
        if (customerData.serviceHistory && Array.isArray(customerData.serviceHistory)) {
          const serviceHistoryWithCustomerInfo = customerData.serviceHistory.map(service => ({
            ...service,
            customerId: customerData.customerId,
            customerName: customerData.customerName,
            customerMobile: customerData.mobile,
            formattedBike: formatVehicleNumber(service.selectedBike),
          }));
          allServiceHistory = allServiceHistory.concat(serviceHistoryWithCustomerInfo);
        }
      });

      const now = moment();
      const threeMonthsAgo = now.clone().subtract(3, 'months');
      const startOfCurrentYear = moment().startOf('year');
      const endOfCurrentYear = moment().endOf('year');  

      const filtered = allServiceHistory.filter(item => {
        if (!item.serviceDate) return false;
        const serviceDate = moment(item.serviceDate);
        return (
          serviceDate.isBefore(threeMonthsAgo) &&
          serviceDate.isBetween(startOfCurrentYear, endOfCurrentYear, null, '[]')
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
      fetchServiceCenterInfo();
      fetchServiceHistory();
    }
  }, [userScId, fetchServiceHistory, fetchServiceCenterInfo]);

  useEffect(() => {
    setFilteredHistory(serviceHistory);
  }, [serviceHistory]);

  const generateWhatsAppMessage = (item) => {
    const name = item.customerName || 'Customer';
    const bike = item.formattedBike || 'your vehicle';
    const serviceDate = item.serviceDate 
      ? moment(item.serviceDate).format('DD/MM/YYYY')
      : 'previous service date';
    const scName = serviceCenterInfo?.serviceCenterName || 'Our Service Center';
    const scMobile = serviceCenterInfo?.proprietorMobile || 'our contact number';

    return `👋 आदरणीय ग्राहक, \n  *${name}*

*${scName}* कडून आपल्याला सौम्य आठवण करून देत आहोत की आपल्या 🏍️ *${bike}* ची सर्विस करण्याची वेळ झाली आहे. शेवटची सर्विस *${serviceDate}* रोजी झाली होती आणि त्यानंतर ३ महिन्यांपेक्षा जास्त कालावधी लोटला आहे.

🔧 नियमित सर्विसिंग केल्यास वाहनाची मायलेज वाढते, सुरक्षितता टिकते आणि इंजिनचे आयुष्य वाढते.  
❗ सेवा वेळेवर न केल्यास वाहनात अचानक बिघाड होण्याची शक्यता वाढते.

📅 वेळेवर अपॉइंटमेंट घेतल्यास तुम्हाला प्राधान्य दिले जाईल व प्रतीक्षा करावी लागणार नाही.

💬 वेळ ठरवण्यासाठी किंवा काही शंका असल्यास कृपया आमच्याशी संपर्क साधा किंवा माझ्या सर्व्हिस सेंटर या : *${scMobile}*

🔧 वेळेवर सर्विस केल्यास:
✔️ मायलेज सुधारते  
✔️ इंजिन आयुष्य वाढते  
✔️ मोठ्या खर्चाची शक्यता कमी होते


🙏 आम्ही तुमच्या वाहनाची तितकीच काळजी घेतो, जितकी तुम्ही!
*${scName}*  
📲 *${scMobile}*

🏍️⚙️🛠️━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🛠️⚙️🏍️

👋 Dear Customer, \n  *${name}*

This is a gentle reminder from *${scName}* that it's time to service your 🏍️ *${bike}*. Your last service was on *${serviceDate}*, and it's been over 3 months since then.

🔧 Regular servicing improves mileage, maintains safety, and extends the engine life.  
❗ Delaying service may lead to unexpected breakdowns or expensive repairs.

📅 Booking your appointment in advance ensures priority service and no waiting.

💬 For bookings or any queries, feel free to contact us at *${scMobile}*.

We care for your ride like you do!
Best regards,  
*${scName}*  
📲 *${scMobile}*`;
  };

  const handleSendReminder = async (item) => {
    const mobile = item.customerMobile;
    if (!mobile) {
      Alert.alert('Error', 'Customer mobile number not available');
      return;
    }

    const phoneWithCountryCode = `91${mobile.replace(/\D/g, '')}`;
    const whatsappMsg = generateWhatsAppMessage(item);
    const whatsappUrl = `whatsapp://send?phone=${phoneWithCountryCode}&text=${encodeURIComponent(whatsappMsg)}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert(
          'WhatsApp Not Found',
          'WhatsApp is not installed or the number is not registered. Do you want to send an SMS instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Send SMS', onPress: () => sendSms(phoneWithCountryCode, whatsappMsg) },
          ]
        );
      }
    } catch (whatsappError) {
      console.error('Failed to open WhatsApp:', whatsappError);
      Alert.alert(
        'Error Opening WhatsApp',
        'Could not open WhatsApp. Do you want to send an SMS instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send SMS', onPress: () => sendSms(phoneWithCountryCode, whatsappMsg) },
        ]
      );
    }
  };

  const sendSms = async (phoneNumber, message) => {
    let smsUrl;
    if (Platform.OS === 'android') {
      smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    } else {
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
        <Text style={styles.serviceTitle}>{item.formattedBike || 'Unknown Vehicle'}</Text>
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