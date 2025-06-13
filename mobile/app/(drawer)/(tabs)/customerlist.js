import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Pressable, Platform, Share, Alert, ScrollView, RefreshControl } from 'react-native';
import UserRoutes from '~/backend/UserRoutes'; // Ensure this path is correct
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { generateAndShareCustomerPDF } from './../../../assets/PdfGenerator'; // Import the new reusable function

const CustomerList = () => {
  const db = useSQLiteContext();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Improved date parser that handles multiple formats
  const parseDate = (dateString) => {
    if (!dateString) return null;

    // Remove any whitespace and normalize separators
    const normalized = dateString.toString().trim().replace(/[\/\-]/g, '-');
    const parts = normalized.split('-');

    if (parts.length === 3) {
      // Try different date formats
      const formats = [
        // { y: 0, m: 1, d: 2 }, //YYYY-MM-DD
        { y: 2, m: 1, d: 0 }, // DD-MM-YYYY
        // { y: 2, m: 0, d: 1 }  // MM-DD-YYYY
      ];

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

  const fetchCustomersFromDB = async () => {
    try {
      setIsLoading(true);
      const allCustomers = await UserRoutes.getCustomerInfo(db);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingCustomers = allCustomers.filter(customer => {
        if (!customer.functionDate) return false;

        const eventDate = parseDate(customer.functionDate);
        if (!eventDate) return false;

        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      }).sort((a, b) => {
        const dateA = parseDate(a.functionDate);
        const dateB = parseDate(b.functionDate);
        return dateA - dateB;
      });

      setCustomers(upcomingCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('त्रुटी', 'ग्राहक डेटा प्राप्त करण्यात अयशस्वी');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteCustomer = (customerId) => {
    Alert.alert(
      'ग्राहक हटवा',
      'तुम्हाला खात्री आहे की तुम्हाला हा ग्राहक हटवायचा आहे?',
      [
        {
          text: 'रद्द करा',
          style: 'cancel',
        },
        {
          text: 'हटवा',
          onPress: async () => {
            try {
              await UserRoutes.deleteCustomerInfo(db, customerId);
              Alert.alert('यशस्वी', 'ग्राहक यशस्वीरित्या हटवला');
              setModalVisible(false); // Close modal after deletion
              await fetchCustomersFromDB(); // Refresh the list
            } catch (error) {
              console.error('Error deleting customer:', error);
              Alert.alert('त्रुटी', 'ग्राहक हटवण्यात अयशस्वी');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomersFromDB();
  };

  useEffect(() => {
    fetchCustomersFromDB();
  }, []);

   useFocusEffect(
      useCallback(() => {
        fetchCustomersFromDB();
        // No cleanup function needed for data fetching
      }, [])
    );

  const renderListSection = (title, items) => {
    if (!items || items.length === 0) {
      return (
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.modalText}>No {title.toLowerCase()} available</Text>
        </View>
      );
    }

    return (
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.map((item, index) => (
          <Text key={index} style={styles.modalText}>
            {index + 1}. {item.name} - {item.quantity} {item.unit}
          </Text>
        ))}
      </View>
    );
  };

  // Use the reusable function
  const handleGenerateAndSharePDF = async (customer) => {
    // Pass the customer data and the path to your logo asset
    await generateAndShareCustomerPDF(customer); // Adjust the logo path if necessary
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedCustomer(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.details}>मोबाईल: {item.mobile}</Text>
        <Text style={styles.details}>कार्यक्रम: {item.functionType}</Text>
        <Text style={styles.details}>दिनांक: {item.functionDate}</Text>
        <Text style={styles.details}>कार्यक्रमचा पत्ता: {item.venueAddress}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButtonCard}
        onPress={() => handleDeleteCustomer(item.id)}
      >
        <Text style={styles.deleteButtonText}>हटवा</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderMealCategory = (title, items) => {
    return (
      <View style={styles.mealCategorySection}>
        <Text style={styles.mealCategoryTitle}>{title}: </Text>
        <Text style={styles.modalText}>
          {(items && items.length > 0) ? items.join(', ') : 'नाही'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>लोड होत आहे...</Text>
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>कोणतेही आगामी कार्यक्रम नाहीत</Text>
          <Text style={styles.emptySubText}>
            (आजची तारीख: {new Date().toLocaleDateString('en-IN')})
          </Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2F80ED']}
            />
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            {selectedCustomer && (
              <>
                <Text style={styles.modalTitle}>ग्राहक माहिती</Text>
                <Text style={styles.modalText}>पूर्ण नाव: {selectedCustomer.fullName}</Text>
                <Text style={styles.modalText}>मोबाईल: {selectedCustomer.mobile}</Text>
                <Text style={styles.modalText}>पत्ता: {selectedCustomer.address}</Text>
                <Text style={styles.modalText}>कार्यक्रम: {selectedCustomer.functionType}</Text>
                <Text style={styles.modalText}>दिनांक: {selectedCustomer.functionDate}</Text>

                {selectedCustomer.mealMenu && (
                  <View>
                    <Text style={styles.sectionTitle}>जेवण मेनू</Text>
                    {renderMealCategory('गोड पदार्थ', selectedCustomer.mealMenu.sweetDishes)}
                    {renderMealCategory('सुकी भाजी', selectedCustomer.mealMenu.dryVegetableDishes)}
                    {renderMealCategory('रस्सा भाजी', selectedCustomer.mealMenu.gravyVegetableDishes)}
                    {renderMealCategory('चपाती', selectedCustomer.mealMenu.breads)}
                    {renderMealCategory('भात', selectedCustomer.mealMenu.rice)}
                    {renderMealCategory('इतर पदार्थ', selectedCustomer.mealMenu.others)}
                    {renderMealCategory('भाजीचे पदार्थ', selectedCustomer.mealMenu.vegetableDishes)}
                  </View>
                )}

                <Text style={styles.sectionTitle}>पेमेंट माहिती</Text>
                <Text style={styles.totalAmount}>एकूण रक्कम: ₹{selectedCustomer.totalAmount || 0}</Text>
                <Text style={styles.advanceAmount}>अ‍ॅडव्हान्स: ₹{selectedCustomer.advanceAmount || 0}</Text>
                <Text style={styles.balanceAmount}>शिल्लक: ₹{selectedCustomer.balanceAmount || 0}</Text>

                {renderListSection('सामग्री यादी', selectedCustomer.items)}
              </>
            )}

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.button, styles.shareButton]}
                onPress={() => {
                  setModalVisible(false);
                  handleGenerateAndSharePDF(selectedCustomer); // Call the new handler
                }}
              >
                <Text style={styles.buttonText}>PDF शेअर करा</Text>
              </Pressable>
              
              <Pressable
                style={[styles.button, styles.closeButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>बंद करा</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 10,
    flexDirection: 'row', // To align content and button
    justifyContent: 'space-between', // To push button to the right
    alignItems: 'center',
  },
  cardContent: {
    flex: 1, // Take up remaining space
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  details: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  deleteButtonCard: {
    backgroundColor: '#d62279',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10, // Space between content and button
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2F80ED',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#2F80ED',
  },
  mealCategorySection: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  mealCategoryTitle: {
    fontWeight: 'bold',
    color: '#555',
  },
  totalAmount: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  advanceAmount: {
    fontSize: 16,
    marginBottom: 8,
    color: '#27AE60',
  },
  balanceAmount: {
    fontSize: 16,
    marginBottom: 15,
    color: '#d62279',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingBottom: 35,
  },
  button: {
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#079ebc',
  },
  deleteButtonModal: {
    backgroundColor: '#EB5757',
  },
  closeButton: {
    backgroundColor: '#d62279',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 20,
  },
});

export default CustomerList;