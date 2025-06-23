import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Appbar, List, FAB, ActivityIndicator, Text, Button, Card, Title, Paragraph } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import API from '../../../config/axiosInstance';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

  const [customersWithHistory, setCustomersWithHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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
      setCustomersWithHistory(filtered);
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
            fetchData();
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

  const renderCustomerItem = ({ item: customer }) => (
    <Card style={styles.customerCard}>
      <Card.Content>
        <View style={styles.customerHeader}>
          <MaterialIcons name="person" size={24} color={COLORS.primary} />
          <Title style={styles.customerName}>{customer.customerName}</Title>
        </View>
        
        <View style={styles.customerInfo}>
          <Paragraph style={styles.infoText}>
            <MaterialIcons name="phone" size={16} color={COLORS.lightText} /> {customer.mobile}
          </Paragraph>
          <Paragraph style={styles.infoText}>
            <MaterialIcons name="directions-bike" size={16} color={COLORS.lightText} /> {customer.vehicles}
          </Paragraph>
        </View>

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
                  <Paragraph style={styles.serviceDate}>{sh.serviceDate}</Paragraph>
                </View>
                
                <View style={styles.serviceDetail}>
                  <MaterialIcons name="two-wheeler" size={16} color={COLORS.lightText} />
                  <Paragraph style={styles.serviceText}>{sh.selectedBike}</Paragraph>
                </View>
                
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
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(107, 66, 246, 0.05)', 'rgba(138, 93, 254, 0.02)']}
        style={StyleSheet.absoluteFill}
      />
      
      <Appbar.Header style={styles.header}>
        <Appbar.Content 
          title="Service History" 
          titleStyle={styles.headerTitle}
        />
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
      ) : customersWithHistory.length === 0 ? (
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
          data={customersWithHistory}
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

      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Service"
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
    backgroundColor: COLORS.card,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 10,
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
    paddingBottom: 90,
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
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  customerInfo: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  infoText: {
    color: COLORS.text,
    fontSize: 14,
    marginVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    elevation: 0,
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
    margin: 24,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    elevation: 4,
  },
});

export default ServiceHistoryListScreen;