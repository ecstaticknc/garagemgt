import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Modal, Pressable, Alert,Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
// import UserRoutes from '~/backend/UserRoutes';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView } from 'react-native-gesture-handler';
import { generateAndShareCustomerPDF } from './../../../assets/PdfGenerator';

const ITEMS_PER_PAGE = 10;

const CompletedEvents = () => {
  const db = useSQLiteContext();
  const [completedCustomers, setCompletedCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [balanceFilter, setBalanceFilter] = useState('all');

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const normalized = dateString.toString().trim().replace(/[\/\-]/g, '-');
    const parts = normalized.split('-');

    if (parts.length === 3) {
      const formats = [{ y: 2, m: 1, d: 0 }]; // DD-MM-YYYY
      for (const format of formats) {
        const year = parseInt(parts[format.y]);
        const month = parseInt(parts[format.m]) - 1;
        const day = parseInt(parts[format.d]);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    console.warn(`Could not parse date: ${dateString}`);
    return null;
  };

  const fetchCompletedEvents = async () => {
    try {
      setIsLoading(true);
      const result = await UserRoutes.getCustomerInfo(db);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const filtered = result.filter(customer => {
        if (!customer.functionDate) return false;
        const eventDate = parseDate(customer.functionDate);
        if (!eventDate) return false;
        eventDate.setHours(23, 59, 59, 999);
        return eventDate < today;
      }).sort((a, b) => {
        const dateA = parseDate(a.functionDate);
        const dateB = parseDate(b.functionDate);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
      });

      setCompletedCustomers(filtered);
    } catch (err) {
      console.error('Error fetching completed events:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCompletedEvents();
  };

  useEffect(() => {
    fetchCompletedEvents();
  }, []);

   useFocusEffect(
        useCallback(() => {
          fetchCompletedEvents();
        }, [])
      );

  //console.log("filteredCustomers:", completedCustomers);

  const filteredCustomers = completedCustomers.filter((cust) => {
  const balance = Number(cust.balanceAmount) || 0;
  if (balanceFilter === 'zero') return balance === 0;
  if (balanceFilter === 'positive') return balance > 0;
  return true;
});

const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const currentItems = filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleCardPress = (customer) => {
    // Only open modal if balance is not 0
    const balance = Number(customer.balanceAmount) || 0;
    if (balance !== 0) {
      setSelectedCustomer(customer);
      setModalVisible(true);
    }
  };

  const clearBalance = async () => {
    if (!selectedCustomer) return;

    Alert.alert(
      "खात्री करा",
      `तुम्ही ${selectedCustomer.fullName} साठी शिल्लक रक्कम साफ करू इच्छिता?`,
      [
        {
          text: "रद्द करा",
          style: "cancel"
        },
        {
          text: "साफ करा",
          onPress: async () => {
            try {
              const result = await UserRoutes.clearCustomerBalance(db, selectedCustomer.id);
              if (result.success) {
                setModalVisible(false);
                await fetchCompletedEvents();
                Alert.alert("यशस्वी", "शिल्लक रक्कम यशस्वीरित्या साफ केली.");
              } else {
                Alert.alert("माहिती", "शिल्लक रक्कम आधीच साफ झाली होती किंवा ग्राहक सापडला नाही.");
              }
            } catch (error) {
              console.error("Error clearing balance:", error);
              Alert.alert("त्रुटी", "शिल्लक रक्कम साफ करण्यात अयशस्वी.");
            }
          }
        }
      ]
    );
  };

  // Re-usable component for balance display with tick
  const BalanceDisplay = ({ amount }) => {
    const numericAmount = Number(amount) || 0;
    return (
      <View style={styles.balanceDisplayContainer}>
        <Text style={[styles.reminiamt, numericAmount > 0 && styles.redText]}>
          ₹{numericAmount.toFixed(2)}
        </Text>
        {numericAmount === 0 && (
          <Feather name="check-circle" size={20} color="green" style={styles.checkIconCard} />
        )}
      </View>
    );
  };

  // Use the reusable function
    const handleGenerateAndSharePDF = async (customer) => {
      // Pass the customer data and the path to your logo asset
      await generateAndShareCustomerPDF(customer); // Adjust the logo path if necessary
    };

  const renderItem = ({ item }) => {
    const initials = item.fullName?.slice(0, 1)?.toUpperCase() || '?';
    const balance = Number(item.balanceAmount) || 0; // Ensure balance is a number

    return (
      <TouchableOpacity
        style={styles.card}
        // Disable onPress if balance is 0
        onPress={balance === 0 ? undefined : () => handleCardPress(item)}
        activeOpacity={balance === 0 ? 1 : 0.7} // Prevent visual feedback if not clickable
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.name}>{item.fullName || 'N/A'}</Text>
          <Text style={styles.details}>📞 {item.mobile || 'N/A'}</Text>
          <Text style={styles.details}>🎉 {item.functionType || 'N/A'}</Text>
          <Text style={styles.date}>📅 {item.functionDate || 'N/A'}</Text>
          {/* Use the BalanceDisplay component directly */}
          <BalanceDisplay amount={item.balanceAmount} />
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>लोड होत आहे...</Text>
      </View>
    );
  }

  return (
    <>
    <View style={styles.container}>
      {completedCustomers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>कोणतेही पूर्ण कार्यक्रम नाहीत</Text>
        </View>
      ) : (
        <>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, balanceFilter === 'all' && styles.activeFilter]}
            onPress={() => {
              setBalanceFilter('all');
              setCurrentPage(1);
            }}>
            <Text style={styles.filterText}>सर्व</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, balanceFilter === 'zero' && styles.activeFilter]}
            onPress={() => {
              setBalanceFilter('zero');
              setCurrentPage(1);
            }}>
            <Text style={styles.filterText}>अप्रलंबित रक्कम</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, balanceFilter === 'positive' && styles.activeFilter]}
            onPress={() => {
              setBalanceFilter('positive');
              setCurrentPage(1);
            }}>
            <Text style={styles.filterText}>प्रलंबित रक्कम</Text>
          </TouchableOpacity>
        </View>
          <FlatList
            data={currentItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2F80ED']} />
            }
          />

          
        </>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ScrollView style={{ width: '100%' }}>
              {selectedCustomer && (
                <>
                  <Text style={styles.modalTitle}>{selectedCustomer.fullName || 'N/A'}</Text>
                  <Text style={styles.modalDetail}>एकूण रक्कम: ₹{selectedCustomer.totalAmount ? Number(selectedCustomer.totalAmount).toFixed(2) : '0.00'}</Text>
                  <Text style={styles.modalDetail}>अ‍ॅडव्हान्स रक्कम: ₹{selectedCustomer.advanceAmount ? Number(selectedCustomer.advanceAmount).toFixed(2) : '0.00'}</Text>
                  <BalanceDisplay amount={selectedCustomer.balanceAmount} />

                  {Number(selectedCustomer.balanceAmount) > 0 && (
                    <TouchableOpacity style={styles.clearBalanceButton} onPress={clearBalance}>
                      <Text style={styles.clearBalanceButtonText}>शिल्लक रक्कम घेत आहे</Text>
                    </TouchableOpacity>
                  )}
                  {/* Share PDF Button */}
                  <Pressable
                    style={[styles.button, styles.shareButton]}
                    onPress={() => {
                      // No need to setModalVisible(false) here, it happens after share
                      handleGenerateAndSharePDF(selectedCustomer);
                    }}
                  >
                    <Text style={styles.buttonText}>PDF शेअर करा</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.textStyle}>बंद करा</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F0F4F8',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#749df7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: '#444',
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  balanceDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  reminiamt: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  redText: {
    color: 'red',
  },
  checkIconCard: {
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#555',
  }, 
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  pageInfo: {
    fontSize: 15,
    color: '#555',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  modalDetail: {
    fontSize: 17,
    marginBottom: 10,
    color: '#444',
    textAlign: 'center',
  },
  clearBalanceButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 25,
    elevation: 2,
  },
  clearBalanceButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    elevation: 2,
    marginTop: 20,
  },
  shareButton: {
    backgroundColor: '#079ebc',
  },
  buttonClose: {
    backgroundColor: '#d62279',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 17,
  },
  filterContainer: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginBottom: 12,
},
filterButton: {
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 20,
  backgroundColor: '#899193',
},
activeFilter: {
  backgroundColor: '#079ebc',
},
filterText: {
  color: 'white', // Changed to white for active filter, adjust if needed
  fontWeight: '600',
},
});

export default CompletedEvents;