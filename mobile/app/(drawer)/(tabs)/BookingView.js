import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Pressable, Platform, Alert, ScrollView } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// import UserRoutes from '~/backend/UserRoutes';
import { useSQLiteContext } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from '@react-navigation/native';
import { CalendarList } from 'react-native-calendars';
import { generateAndShareCustomerPDF } from '~/assets/PdfGenerator';

const BookingMonthView = () => {
  const db = useSQLiteContext();
  const [allBookings, setAllBookings] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayBookings, setSelectedDayBookings] = useState([]);
  const [selectedDateString, setSelectedDateString] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const normalized = dateString.toString().trim().replace(/[\/\-]/g, '-');
    const parts = normalized.split('-');

    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    console.warn(`Could not parse date: ${dateString}`);
    return null;
  };

  const formatDateForCalendar = (dateString) => {
    const date = parseDate(dateString);
    if (!date) return null;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchAllBookingsFromDB = async (yearToDisplay = new Date().getFullYear()) => {
    try {
      setIsLoading(true);
      const allBookingsData = await UserRoutes.getCustomerInfo(db);
      setAllBookings(allBookingsData);

      const yearsWithBookings = new Set();
      const newMarkedDates = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      allBookingsData.forEach(booking => {
        const formattedDate = formatDateForCalendar(booking.functionDate);
        const bookingDate = parseDate(booking.functionDate);

        if (formattedDate && bookingDate) {
          const bookingYear = bookingDate.getFullYear();
          yearsWithBookings.add(bookingYear);

          if (bookingYear === yearToDisplay) {
            bookingDate.setHours(0, 0, 0, 0);

            const isCompleted = bookingDate < today;
            const color = isCompleted ? '#d62279' : '#079ebc';

            if (!newMarkedDates[formattedDate]) {
              newMarkedDates[formattedDate] = {
                customStyles: {
                  container: {
                    backgroundColor: color,
                    borderRadius: 16,
                  },
                  text: {
                    color: 'white',
                    fontWeight: 'bold',
                  },
                },
                bookings: [],
              };
            } else {
              if (!isCompleted && newMarkedDates[formattedDate].customStyles.container.backgroundColor === 'red') {
                newMarkedDates[formattedDate].customStyles.container.backgroundColor = color;
              }
            }
            newMarkedDates[formattedDate].bookings.push(booking);
          }
        }
      });

      const sortedYears = Array.from(yearsWithBookings).sort((a, b) => a - b);
      setAvailableYears(sortedYears);

      if (sortedYears.length > 0 && !sortedYears.includes(selectedYear)) {
        setSelectedYear(sortedYears[0]);
      } else if (sortedYears.length > 0 && selectedYear === new Date().getFullYear() && !sortedYears.includes(new Date().getFullYear())) {
        setSelectedYear(sortedYears[0]);
      } else if (sortedYears.length === 0) {
        setSelectedYear(new Date().getFullYear());
      }

      setMarkedDates(newMarkedDates);

      const todayDateString = new Date().toISOString().split('T')[0];
      if (newMarkedDates[todayDateString] && newMarkedDates[todayDateString].bookings.length > 0) {
        setSelectedDateString(todayDateString);
        setSelectedDayBookings(newMarkedDates[todayDateString].bookings);
      } else {
        setSelectedDayBookings([]);
        setSelectedDateString(null);
      }

    } catch (error) {
      console.error('Error fetching bookings for calendar:', error);
      Alert.alert('त्रुटी', 'बुकिंग डेटा प्राप्त करण्यात अयशस्वी');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookingsFromDB(selectedYear);
  }, [selectedYear]);

  useFocusEffect(
    useCallback(() => {
      setSelectedDayBookings([]);
      setSelectedDateString(null);
      fetchAllBookingsFromDB(selectedYear);
    }, [selectedYear])
  );

    const handleGenerateAndSharePDF = async (customer) => {
         // Pass the customer data and the path to your logo asset
         await generateAndShareCustomerPDF(customer); // Adjust the logo path if necessary
       };

  return (
    <ScrollView style={styles.container}>
      {/* <View style={styles.yearPickerContainer}>
        <Text style={styles.yearPickerLabel}>वर्ष निवडा:</Text>
        <Picker
          selectedValue={selectedYear}
          onValueChange={(itemValue) => {
            setSelectedYear(itemValue);
            setSelectedDayBookings([]);
            setSelectedDateString(null);
          }}
          style={styles.picker}
          itemStyle={Platform.OS === 'ios' ? styles.pickerItem : {}}
        >
          {availableYears.length > 0 ? (
            availableYears.map(year => (
              <Picker.Item key={year} label={String(year)} value={year} />
            ))
          ) : (
            <Picker.Item label={String(new Date().getFullYear())} value={new Date().getFullYear()} />
          )}
        </Picker>
      </View> */}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>लोड होत आहे...</Text>
        </View>
      ) : (
        <CalendarList
          current={new Date().toISOString().split('T')[0]}
          markingType={'custom'}
          onDayPress={(day) => {
            const dateStr = day.dateString;
            const dayMarking = markedDates[dateStr];

            setSelectedDateString(dateStr);

            if (dayMarking && dayMarking.bookings && dayMarking.bookings.length > 0) {
              setSelectedDayBookings(dayMarking.bookings);
            } else {
              setSelectedDayBookings([]);
              Alert.alert('माहिती', 'या दिवशी कोणतेही बुकिंग नाही.');
            }
          }}
          markedDates={markedDates}
          pastScrollRange={60}
          futureScrollRange={60}
          horizontal={true}
          pagingEnabled={true}
          showLoader={false}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            todayTextColor: '#2F80ED',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            arrowColor: '#2F80ED',
            monthTextColor: '#2F80ED',
            indicatorColor: 'blue',
            textDayFontFamily: 'monospace',
            textMonthFontFamily: 'monospace',
            textDayHeaderFontFamily: 'monospace',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 16
          }}
        />
      )}

      {selectedDayBookings.length > 0 && (
        <View style={styles.selectedDayBookingsContainer}>
          <Text style={styles.selectedDayBookingsTitle}>
            {selectedDateString ? `बुकिंग (${selectedDateString})` : 'बुकिंग'}
          </Text>
          <View style={{ backgroundColor: '#f5f5f5' }}>
            <FlatList
              scrollEnabled={false}
              data={selectedDayBookings}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItemCard}
                  onPress={() => {
                    setSelectedBooking(item);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.listItemName}>{item.fullName || 'N/A'}</Text>
                  <Text style={styles.listItemDetails}>कार्यक्रम: {item.functionType || 'N/A'}</Text>
                  <Text style={styles.listItemDetails}>मोबाईल: {item.mobile || 'N/A'}</Text>                 
                   <Text style={styles.listItemDetails}>कार्यक्रमचा पत्ता: {item.venueAddress}</Text>
                    <Text style={styles.listItemDuePay}>देय रक्कम: ₹{item.balanceAmount || 0}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
          >
            {selectedBooking ? (
              <>
                <Text style={styles.modalTitle}>बुकिंग माहिती</Text>
                <Text style={styles.modalText}>पूर्ण नाव: {selectedBooking.fullName || 'N/A'}</Text>
                <Text style={styles.modalText}>दिनांक: {selectedBooking.functionDate || 'N/A'}</Text>
                <Text style={styles.modalText}>एकूण रक्कम: ₹{selectedBooking.totalAmount || 0}</Text>
                <Text style={styles.modalText}>भरलेले रक्कम: ₹{selectedBooking.advanceAmount || 0}</Text>
                <Text style={styles.listItemDuePay}>देय रक्कम: ₹{selectedBooking.balanceAmount || 0}</Text>
                <Pressable
                  style={[styles.button, styles.shareButton, { marginTop: 20 }]}
                  onPress={() => {
                    handleGenerateAndSharePDF(selectedBooking);
                  }}
                >
                  <Text style={styles.buttonText}>पूर्ण तपशील PDF</Text>
                </Pressable>
                
              </>
            ) : (
              <Text style={styles.modalText}>No booking selected</Text>
            )}

            <View style={styles.modalButtons}>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    maxHeight: '45%',
  },
  modalContentContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2F80ED',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    width: '100%',
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
  selectedDayBookingsContainer: {
    marginTop: 10,
    paddingHorizontal: 15,
  },
  selectedDayBookingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  listItemCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2F80ED',
    marginBottom: 4,
  },
  listItemDetails: {
    fontSize: 14,
    color: '#666',
  },
  listItemDuePay: {
    fontSize: 14,
    color: '#d62279',
  },
  listContainer: {
    paddingBottom: 20,
  },
  yearPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 15,
  },
  picker: {
    height: 50,
    width: 120,
  },
  pickerItem: {
    fontSize: 16,
    color: '#2F80ED',
  },
  yearPickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#333',
  },
});

export default BookingMonthView;