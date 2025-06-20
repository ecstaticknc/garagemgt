import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity, 
  Linking,
  RefreshControl 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { SlideOutRight } from 'react-native-reanimated';
import { _get } from '../../../context/AuthContext';

const ITEM_HEIGHT = 130;

const CustomerItem = React.memo(({ item, onSendReminder }) => (
  <Animated.View exiting={SlideOutRight.delay(500)} style={styles.customerCard}>
    <Text style={styles.customerName}>{item.customerName || 'N/A'}</Text>
    
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>📱 Mobile:</Text>
      <Text style={styles.detailValue}>{item.mobile || 'N/A'}</Text>
    </View>
    
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>📅 Last Service:</Text>
      <Text style={[styles.detailValue, !item.date && styles.missingData]}>
        {item.date ? moment(item.date).format("DD/MM/YYYY") : "Not recorded"}
      </Text>
    </View>
    
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>🏍️ Vehicles:</Text>
      <View style={styles.vehiclesContainer}>
        {item.vehicles?.length > 0 ? (
          item.vehicles.map((vehicle, index) => (
            <Text key={`${vehicle?.vehicleNumber}-${index}`} style={styles.vehicleText}>
              {index > 0 ? ', ' : ''}{vehicle?.vehicleNumber}
            </Text>
          ))
        ) : (
          <Text style={styles.missingData}>None listed</Text>
        )}
      </View>
    </View>

    <TouchableOpacity 
      style={styles.reminderButton} 
      onPress={() => onSendReminder(item.mobile, item.vehicles[0]?.vehicleNumber, item.customerName)}
    >
      <Text style={styles.reminderButtonText}>📲 Send WhatsApp Reminder</Text>
    </TouchableOpacity>
  </Animated.View>
));

export default function Reminder() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSCName, setSelectedSCName] = useState('');
  const [proprietorMobile, setProprietorMobile] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const SCId = await AsyncStorage.getItem('currentSCId');
      const SCName = await AsyncStorage.getItem('serviceCenterName');
      
      if (!SCId) {
        Alert.alert('Error', 'Service Center ID not found');
        return;
      }

      setSelectedSCName(SCName || '');

      // Fetch service center details
      const serviceCenterResponse = await _get(`/serviceCenters/${SCId}.json`);
      if (serviceCenterResponse.data?.proprietorMobile) {
        setProprietorMobile(serviceCenterResponse.data.proprietorMobile);
      }

      // Fetch customers
      const response = await _get(`/serviceCenters/${SCId}/customers.json`);
      const data = response.data;
      
      if (data) {
        const customersArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          vehicles: Array.isArray(data[key].vehicles) 
            ? data[key].vehicles 
            : data[key].vehicles ? [data[key].vehicles] : []
        }));
        setCustomers(customersArray);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load customer data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const filteredCustomers = useMemo(() => {
    if (!customers.length) return [];
    
    const cutoffDate = moment().subtract(82, 'days');
    
    return customers.filter(customer => {
      const customerDate = moment(customer.date);
      return !customer.date || customerDate.isSameOrBefore(cutoffDate);
    }).filter(customer => 
      (customer.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.mobile || '').includes(searchTerm) ||
      (customer.vehicles?.some(vehicle => 
        vehicle.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  }, [searchTerm, customers]);

  const sendWhatsAppReminder = useCallback((mobile, vehicleNumber, customerName) => {
    if (!mobile) {
      Alert.alert('Error', 'Customer mobile number is missing');
      return;
    }

    if (!vehicleNumber) {
      Alert.alert('Error', 'Vehicle number is missing');
      return;
    }

    if (!proprietorMobile) {
      Alert.alert('Error', 'Service center contact information not available');
      return;
    }

    const msg = `👋 Dear Customer, *${customerName}*
    \n\nThis is a friendly reminder from *${selectedSCName}* that it's time to service your 🏍️ Vehicle No. *${vehicleNumber}*. It has been over 3 months since your last service, and we recommend scheduling a maintenance appointment to keep your vehicle running smoothly.
    \n🔹If you have any questions or would like to book a service, please feel free to contact us at *${proprietorMobile}*. We look forward to assisting you.
    \n\nBest regards, *${selectedSCName}*
                      \n📲 *${proprietorMobile}*
    
                      \n\n👋 आदरणीय ग्राहक,  *${customerName}*
    
  🔹*${selectedSCName}* कडून आपल्याला एक सौम्य आठवण देत आहोत की आपल्या वाहनाची 🏍️*${vehicleNumber}*. सर्विस  करण्याची वेळ झाली आहे. आपल्या वाहनाची सर्विस  केल्यापासून ३ महिन्यांपेक्षा जास्त काळ झाला आहे, आणि आम्ही आपल्याला वाहनाची देखभाल करण्याचा सल्ला देतो.
    
  🔹आपल्याला काही प्रश्न असल्यास किंवा सेवा बुक करायची असल्यास, कृपया आमच्याशी संपर्क साधा:
  🔹आम्ही आपली सेवा करण्यास उत्सुक आहोत.
    
धन्यवाद,
      *${selectedSCName}*
       
कृपया मोकळ्या मनाने माझ्याशी संपर्क साधा 😊
 \n    📲 *${proprietorMobile}*`;

    const phoneWithCountryCode = `+91${mobile}`;
    const url = `whatsapp://send?text=${encodeURIComponent(msg)}&phone=${phoneWithCountryCode}`;

    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open WhatsApp. Please make sure it's installed.");
    });
  }, [selectedSCName, proprietorMobile]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A8FE7" />
        <Text style={styles.loadingText}>Loading customer data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Service Reminders</Text>
        <Text style={styles.headerSubtitle}>Customers due for service</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, mobile or vehicle..."
          placeholderTextColor="#888"
          value={searchTerm}
          onChangeText={setSearchTerm}
          clearButtonMode="while-editing"
        />
      </View>

      {filteredCustomers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {searchTerm ? 'No matching customers found' : 'No customers due for reminders'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={({ item }) => (
            <CustomerItem 
              item={item}
              onSendReminder={sendWhatsAppReminder}
            />
          )}
          keyExtractor={(item) => item.id}
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4A8FE7']}
              tintColor="#4A8FE7"
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    color: '#4A8FE7',
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customerCard: {
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
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  missingData: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  vehiclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  vehicleText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  reminderButton: {
    marginTop: 16,
    backgroundColor: '#4A8FE7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 8,
  },
});