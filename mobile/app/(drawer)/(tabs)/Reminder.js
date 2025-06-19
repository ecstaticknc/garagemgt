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
} from 'react-native';
import { Appbar, Button, List } from 'react-native-paper';
import { useNavigation } from 'expo-router';
import API from '../../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/AuthContext';

const ReminderScreen = () => {
  const navigation = useNavigation();
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);
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
    console.log("response", response.data.data)
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
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

      const filtered = response.data.data.filter(item => {
        if (!item.serviceDate) return false;
        const date = new Date(item.serviceDate);
        return date < threeMonthsAgo;
      });

      setServiceHistory(filtered);
      const userData = await AsyncStorage.getItem('loggedInUser');
    if (userData) {
      setLoggedInUser(JSON.parse(userData));
    }
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

  

  const handleSendReminder = (item) => {
  const customer = customers.find(c => c.id === item?.customerId);
  const name = customer?.customerName || 'Customer';
  //const mobile = customer?.mobile || '';

  console.log("customer",customer)
console.log("item",item?.customerId)
   const formattedDate = item?.serviceDate ? new Date(item?.serviceDate).toDateString() : 'N/A';

//   const whatsappMsg = `Hello ${name},\n\nThis is a friendly reminder for your ${item?.selectedBike}. Your last service was on ${formattedDate}, which was more than 3 months ago. It's time to schedule your next service!\n\n[Your Service Center Name]`;
//   const smsMsg = `Hi ${name}, your ${item?.selectedBike} was serviced on ${formattedDate}. It's due again. Call us to book your appointment. [Your Service Center Name]`;

//   const isWhatsApp = mobile && mobile.length >= 10;
//   const encodedMessage = encodeURIComponent(whatsappMsg);

//   if (isWhatsApp) {
//     // const waURL = `https://api.whatsapp.com/send?phone=${mobile}&text=${encodedMessage}`;
//     const waURL = `https://api.whatsapp.com/send?phone=9766474227&text="Hello"`
//     Linking.openURL(waURL).catch(() => {
//       Alert.alert('Error', 'Failed to open WhatsApp. Falling back to SMS.');
//       Linking.openURL(`sms:${mobile}?body=${encodeURIComponent(smsMsg)}`);
//     });
//   } else {
//     Linking.openURL(`sms:${mobile}?body=${encodeURIComponent(smsMsg)}`).catch(() =>
//       Alert.alert('Error', 'Failed to open SMS app.')
//     );
//   }
const rawMobile = customer?.mobile || '';
const countryCode = '91'; // Change as needed

const mobile = `${countryCode}${rawMobile.replace(/\D/g, '')}`; // e.g. 919766474227

//const message = `Hello, this is a reminder from your service center.`;
const whatsappMsg = `Hello ${name},\n\nThis is a friendly reminder for your ${item?.selectedBike}. Your last service was on ${formattedDate}, which was more than 3 months ago. It's time to schedule your next service!\n\n[Your Service Center Name]`;
const encodedMessage = encodeURIComponent(whatsappMsg);

const waURL = `https://api.whatsapp.com/send?phone=${mobile}&text=${encodedMessage}`;

Linking.openURL(waURL).catch(() => {
  Alert.alert('Error', 'Failed to open WhatsApp. Falling back to SMS.');
  Linking.openURL(`sms:${rawMobile}?body=${encodeURIComponent(message)}`);
});
};


  const renderItem = ({ item }) => (
    <List.Item
      title={`Vehicle: ${item.selectedBike}`}
      description={`Last Service: ${new Date(item.serviceDate).toLocaleDateString()}`}
      left={props => <List.Icon {...props} icon="bell" />}
      right={() => (
        <Button
          mode="contained"
          onPress={() =>
            handleSendReminder(item)
          }
          style={styles.button}
        >
          Remind
        </Button>
      )}
      style={styles.listItem}
    />
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading reminders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={fetchServiceHistory} mode="contained">
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Service Reminders" />
      </Appbar.Header>
      <FlatList
        data={serviceHistory}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchServiceHistory} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No service reminders needed.</Text>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
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
  listItem: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  button: {
    marginVertical: 4,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#777',
  },
});

export default ReminderScreen;
