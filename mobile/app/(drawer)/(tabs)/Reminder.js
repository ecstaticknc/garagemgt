// Reminder.js (Updated)
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
import { Appbar, TextInput } from 'react-native-paper';
import { useNavigation } from 'expo-router';
import API from '../../config/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import moment from 'moment';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons'; // Import Ionicons for checkmark/close icons

// Define a modern color palette consistent with CList.js and SHList.js
const COLORS = {
  primary: '#6B42F6', // A vibrant purple
  secondary: '#8A5DFE', // Lighter purple
  accent: '#FFD700',   // Gold for secondary accents (used in SHList)
  background: '#F0F2F5', // Light grey background (similar to CList.js background)
  text: '#344054',      // Dark grey for primary text
  lightText: '#667085', // Medium grey for secondary text
  card: '#FFFFFF',      // White for cards (cardBackground in CList.js, card in SHList.js)
  danger: '#F04438',    // Red for delete actions (similar to danger in SHList.js)
  success: '#12B76A',   // Green for success (from SHList.js)
  warning: '#F79009',   // Warning color (from SHList.js)
  info: '#06AED4',      // Info color (from SHList.js)
  borderColor: '#E0E0E0', // Light border for subtle separation (from CList.js)
};

const ReminderScreen = () => {
  const navigation = useNavigation();
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { userScId } = useAuth(); // Assuming userScId is available from auth context
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // You will likely get these from your AuthContext or a global state
  // For demonstration, let's use placeholders. Replace with actual values.
  const selectedSCName = "Your Service Center Name"; // Replace with actual value from auth context
  const proprietorMobile = "Your Proprietor Mobile"; // Replace with actual value from auth context

  const fetchServiceHistory = useCallback(async () => {
    if (!userScId) {
      setLoading(false);
      setError('User service center ID not available. Please log in again.');
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    setError(null);
    try {
      const [serviceHistoryResponse, reminderLogsResponse] = await Promise.all([
        API._get(`/servicehistory/byServiceCenter?scId=${userScId}`),
        API._get(`/reminderlogs/servicecenter/${userScId}`), // Fetch reminder logs for the SC
      ]);

      let allServiceHistory = [];
      serviceHistoryResponse.data.data.forEach(customerData => {
        if (customerData.serviceHistory && Array.isArray(customerData.serviceHistory)) {
          const serviceHistoryWithCustomerInfo = customerData.serviceHistory.map(service => ({
            ...service,
            customerId: customerData.customerId,
            customerName: customerData.customerName,
            customerMobile: customerData.mobile,
            vehicleNumber: customerData.vehicles, // Assuming 'vehicles' field contains the vehicle number
          }));
          allServiceHistory = allServiceHistory.concat(serviceHistoryWithCustomerInfo);
        }
      });

      const now = moment();
      const threeMonthsAgo = now.clone().subtract(3, 'months');
      const startOfCurrentYear = moment().startOf('year');
      const endOfCurrentYear = moment().endOf('year');

      // Group service history by customer and find the latest service date for each
      const customerLatestServiceMap = new Map();
      allServiceHistory.forEach(item => {
        const serviceDate = moment(item.serviceDate);
        if (customerLatestServiceMap.has(item.customerId)) {
          const existingLatest = customerLatestServiceMap.get(item.customerId).serviceDate;
          if (serviceDate.isAfter(moment(existingLatest))) {
            customerLatestServiceMap.set(item.customerId, item);
          }
        } else {
          customerLatestServiceMap.set(item.customerId, item);
        }
      });

      // Filter based on the latest service date for each customer
      let filteredReminders = Array.from(customerLatestServiceMap.values()).filter(item => {
        if (!item.serviceDate) return false;

        const serviceDate = moment(item.serviceDate);
        // Ensure the latest service date is OLDER than 3 months AND within the current year
        return serviceDate.isBefore(threeMonthsAgo) && serviceDate.isBetween(startOfCurrentYear, endOfCurrentYear, null, '[]');
      });

      // Process reminder logs and attach to filtered service history
      const reminderLogs = reminderLogsResponse.data.data || [];
      const serviceHistoryIdToLatestLog = new Map();

      reminderLogs.forEach(log => {
        if (log.serviceHistoryId) {
          const existingLog = serviceHistoryIdToLatestLog.get(log.serviceHistoryId);
          // Keep the latest log entry for a given serviceHistoryId
          if (!existingLog || moment(log.reminderDate).isAfter(moment(existingLog.reminderDate))) {
            serviceHistoryIdToLatestLog.set(log.serviceHistoryId, log);
          }
        }
      });

      filteredReminders = filteredReminders.map(item => {
        const latestLog = serviceHistoryIdToLatestLog.get(item.id); // 'item.id' is serviceHistoryId
        return {
          ...item,
          latestReminderLog: latestLog || null, // Attach the latest log or null
        };
      });

      setServiceHistory(filteredReminders);
    } catch (err) {
      console.error('Error fetching reminders or logs:', err);
      setError('Failed to load service reminders or reminder logs.');
      Alert.alert('Error', 'Could not fetch service reminders or logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userScId]);

  useEffect(() => {
    if (userScId) {
      fetchServiceHistory();
    }
  }, [userScId, fetchServiceHistory]);

  const getFilteredReminders = useCallback(() => {
    if (!searchQuery) {
      return serviceHistory;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();

    return serviceHistory.filter(item =>
      item.customerName?.toLowerCase().includes(lowerCaseQuery) ||
      item.customerMobile?.includes(lowerCaseQuery) ||
      item.selectedBike?.toLowerCase().includes(lowerCaseQuery) ||
      item.selectedServices?.toLowerCase().includes(lowerCaseQuery) ||
      item.serviceRemark?.toLowerCase().includes(lowerCaseQuery) ||
      item.vehicleNumber?.toLowerCase().includes(lowerCaseQuery) // Include vehicle number in search
    );
  }, [serviceHistory, searchQuery]);

  const filteredReminders = getFilteredReminders();


  const logReminder = async (logData) => {
    try {
      await API._post('/reminderlogs', logData);
      //console.log('Reminder logged successfully:', logData);
      // After logging, refresh the data to show the status immediately
      fetchServiceHistory();
    } catch (logError) {
      console.error('Failed to log reminder:', logError.response?.data || logError.message);
      // You might want to show an alert here or simply log to console
    }
  };


  const handleSendReminder = async (item) => {
    const mobile = item.customerMobile;
    const name = item.customerName;
    const vehicleNumber = item.vehicleNumber || 'N/A';
    const formattedDate = item.serviceDate
      ? moment(item.serviceDate).format('DD/MM/YYYY')
      : 'N/A';

    if (!mobile) {
      Alert.alert('Error', 'Customer mobile number not available');
      return;
    }

    const whatsappMsg = `👋 आदरणीय ग्राहक, \n  *${name}*

*${scName}* कडून आपल्याला सौम्य आठवण करून देत आहोत की आपल्या 🏍️ *${bike}* ची सर्विस करण्याची वेळ झाली आहे. शेवटची सर्विस *${serviceDate}* रोजी झाली होती आणि त्यानंतर ३ महिन्यांपेक्षा जास्त कालावधी लोटला आहे.

🔧 नियमित सर्विसिंग केल्यास वाहनाची मायलेज वाढते, सुरक्षितता टिकते आणि इंजिनचे आयुष्य वाढते.  
❗ सेवा वेळेवर न केल्यास वाहनात अचानक बिघाड होण्याची शक्यता वाढते.

📅 वेळेवर अपॉइंटमेंट घेतल्यास तुम्हाला प्राधान्य दिले जाईल व प्रतीक्षा करावी लागणार नाही.

💬 वेळ ठरवण्यासाठी किंवा काही शंका असल्यास कृपया आमच्याशी संपर्क साधा: *${scMobile}*
🔧 वेळेवर सर्विस केल्यास:
✔️ मायलेज सुधारते  
✔️ इंजिन आयुष्य वाढते  
✔️ मोठ्या खर्चाची शक्यता कमी होते 
आपल्या वाहनाची काळजी आम्हालाही आहे!  
धन्यवाद,  
*${scName}*  
📲 *${scMobile}*

🏍️⚙️🛠️━━━━━━━━━━━━━━━━━━━━━━━━━━━━🛠️⚙️🏍️

👋 Dear Customer, \n  *${name}*

This is a gentle reminder from *${scName}* that it's time to service your 🏍️ *${bike}*. Your last service was on *${serviceDate}*, and it's been over 3 months since then.

🔧 Regular servicing improves mileage, maintains safety, and extends the engine life.  
❗ Delaying service may lead to unexpected breakdowns or expensive repairs.

📅 Booking your appointment in advance ensures priority service and no waiting.

💬 For bookings or any queries, feel free to contact us at *${scMobile}*.

We care for your bike just like you do!  
Best regards,  
*${scName}*  
📲 *${scMobile}*`;

    // NEW SMS Message for the user's request
    const smsMessage = `${name} Ji, 3+ months since your ${item.selectedBike || 'vehicle'} service at ${selectedSCName}. कृपया सर्विस बुक करा: ${proprietorMobile}. Maintain safety & performance!`;


    const phoneWithCountryCode = `91${mobile.replace(/\D/g, '')}`;

    const whatsappUrl = `whatsapp://send?phone=${phoneWithCountryCode}&text=${encodeURIComponent(whatsappMsg)}`;

    let reminderStatus = 'Attempted'; // Default status for direct attempt
    let failureReason = null;
    let sentVia = 'WhatsApp';

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
        reminderStatus = 'Attempted'; // App opened, but actual message sent status is unknown via Linking
      } else {
        // WhatsApp not found. Prompt user for SMS.
        Alert.alert(
          'WhatsApp Not Found',
          'WhatsApp is not installed or the number is not registered. Do you want to send an SMS instead?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                reminderStatus = 'Not Supported';
                failureReason = 'WhatsApp not found, user cancelled SMS option.';
                logReminder({
                  customerId: item.customerId,
                  serviceHistoryId: item.id, // Use item.id as serviceHistoryId
                  serviceCenterId: userScId,
                  sentVia: sentVia,
                  status: reminderStatus,
                  failureReason: failureReason,
                });
              }
            },
            {
              text: 'Send SMS',
              onPress: async () => {
                // Pass smsMessage here
                const smsResult = await sendSms(phoneWithCountryCode, smsMessage, item);
                reminderStatus = smsResult.status;
                failureReason = smsResult.failureReason;
                sentVia = 'SMS';
                logReminder({
                  customerId: item.customerId,
                  serviceHistoryId: item.id,
                  serviceCenterId: userScId,
                  sentVia: sentVia,
                  status: reminderStatus,
                  failureReason: failureReason,
                });
              },
            },
          ],
          { cancelable: false }
        );
        return; // Exit here, as logging will happen after user choice
      }
    } catch (whatsappError) {
      console.error('Failed to open WhatsApp:', whatsappError);
      reminderStatus = 'Failed';
      failureReason = `Failed to open WhatsApp: ${whatsappError.message}`;
      sentVia = 'WhatsApp';
      Alert.alert(
        'Error Opening WhatsApp',
        'Could not open WhatsApp. Do you want to send an SMS instead?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
                reminderStatus = 'Not Supported';
                failureReason = 'Error opening WhatsApp, user cancelled SMS option.';
                logReminder({
                  customerId: item.customerId,
                  serviceHistoryId: item.id,
                  serviceCenterId: userScId,
                  sentVia: sentVia,
                  status: reminderStatus,
                  failureReason: failureReason,
                });
            }
          },
          {
            text: 'Send SMS',
            onPress: async () => {
              // Pass smsMessage here
              const smsResult = await sendSms(phoneWithCountryCode, smsMessage, item);
              reminderStatus = smsResult.status;
              failureReason = smsResult.failureReason;
              sentVia = 'SMS';
              logReminder({
                customerId: item.customerId,
                serviceHistoryId: item.id,
                serviceCenterId: userScId,
                sentVia: sentVia,
                status: reminderStatus,
                failureReason: failureReason,
              });
            },
          },
        ],
        { cancelable: false }
      );
      return; // Exit here, as logging will happen after user choice
    }

    // If we reach here, it means WhatsApp attempt was made and no SMS prompt was shown or opted.
    logReminder({
      customerId: item.customerId,
      serviceHistoryId: item.id,
      serviceCenterId: userScId,
      sentVia: sentVia,
      status: reminderStatus,
      failureReason: failureReason,
    });
  };

  const sendSms = async (phoneNumber, message, item) => {
    let smsUrl;
    if (Platform.OS === 'android') {
      smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    } else {
      smsUrl = `sms:${phoneNumber}&body=${encodeURIComponent(message)}`;
    }

    let status = 'Failed';
    let reason = null;

    try {
      const supported = await Linking.canOpenURL(smsUrl);
      if (supported) {
        await Linking.openURL(smsUrl);
        status = 'Attempted';
      } else {
        status = 'Not Supported';
        reason = 'Could not open SMS app on your device.';
        Alert.alert('Error', 'Could not open SMS app on your device.');
      }
    } catch (smsError) {
      console.error('Failed to open SMS:', smsError);
      status = 'Failed';
      reason = `An unexpected error occurred while trying to send SMS: ${smsError.message}`;
      Alert.alert('Error', 'An unexpected error occurred while trying to send SMS.');
    }
    return { status, failureReason: reason };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Sent':
        return <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />;
      case 'Attempted':
        return <Ionicons name="information-circle" size={24} color={COLORS.info} />;
      case 'Failed':
        return <Ionicons name="close-circle" size={24} color={COLORS.danger} />;
      case 'Not Supported':
        return <Ionicons name="warning" size={24} color={COLORS.warning} />;
      default:
        return null; // No icon if no reminder attempt yet
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Sent':
        return 'Sent';
      case 'Attempted':
        return 'Attempted';
      case 'Failed':
        return 'Failed';
      case 'Not Supported':
        return 'Not Supported';
      default:
        return 'No Reminder Sent Yet';
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
          📅 Last Service: {moment(item.serviceDate).format('DD/MM/YYYY')}
        </Text>
        <Text style={styles.detailText}>
          🔧 Service Type: {item.selectedServices || 'Not specified'}
        </Text>
        <Text style={styles.detailText}>
          🏍️ Vehicle No: {item.vehicleNumber || 'N/A'}
        </Text>
        {item.latestReminderLog && (
          <View style={styles.reminderStatusContainer}>
            {getStatusIcon(item.latestReminderLog.status)}
            <Text style={[styles.reminderStatusText, { color: item.latestReminderLog.status === 'Sent' ? COLORS.success : item.latestReminderLog.status === 'Failed' ? COLORS.danger : COLORS.info }]}>
              {getStatusText(item.latestReminderLog.status)} via {item.latestReminderLog.sentVia}
              {item.latestReminderLog.failureReason ? ` (${item.latestReminderLog.failureReason})` : ''}
              {moment(item.latestReminderLog.reminderDate).isValid() ? ` on ${moment(item.latestReminderLog.reminderDate).format('DD MMM, LT')}` : ''}
            </Text>
          </View>
        )}
        {!item.latestReminderLog && (
            <Text style={styles.noReminderText}>No reminder sent yet</Text>
        )}
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
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading service reminders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={50} color={COLORS.danger} style={{ marginBottom: 10 }} />
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
        {isSearchVisible ? (
          <>
            <Appbar.Action icon="arrow-left" color={COLORS.card} onPress={() => {
              setIsSearchVisible(false);
              setSearchQuery('');
            }} />
            <TextInput
              placeholder="Search reminders..."
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
            <Appbar.Content
              title="Service Reminders"
              titleStyle={styles.headerTitle}
            />
            <Appbar.Action icon="magnify" color={COLORS.card} onPress={() => setIsSearchVisible(true)} />
            <Appbar.Action
              icon="refresh"
              color={COLORS.card}
              onPress={() => {
                setRefreshing(true);
                fetchServiceHistory();
              }}
            />
          </>
        )}
      </Appbar.Header>

      <FlatList
        data={filteredReminders}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchServiceHistory}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          filteredReminders.length === 0 && searchQuery ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={48} color={COLORS.lightText} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyStateText}>No matching reminders found for "{searchQuery}"</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.retryButtonText}>Clear Search</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="bell-o" size={48} color={COLORS.lightText} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyStateText}>No service reminders needed</Text>
              <Text style={styles.emptyStateSubtext}>Services older than 3 months will appear here from the current date</Text>
            </View>
          )
        }
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
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.card,
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    color: COLORS.card,
    fontSize: 16,
    marginRight: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: '80%',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: COLORS.card,
    fontWeight: '600',
    fontSize: 16,
  },
  serviceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flexShrink: 1,
    marginRight: 10,
  },
  serviceTitle: {
    fontSize: 16,
    color: COLORS.lightText,
    textAlign: 'right',
  },
  serviceDetails: {
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
    paddingTop: 12,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
  },
  reminderStatusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  noReminderText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.lightText,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
  },
  remindButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  remindButtonText: {
    color: COLORS.card,
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
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 8,
  },
});

export default ReminderScreen;