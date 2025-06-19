import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, RefreshControl } from 'react-native';
import { Appbar, Card, Title, Paragraph, ActivityIndicator, Text, Button, useTheme } from 'react-native-paper';
import API from '../../../config/axiosInstance';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CustomerDetailScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { colors } = theme;
  const params = useLocalSearchParams();
  
  // Extract ID with multiple possible param names
  const customerId = params?.id || params?.customerId;
  
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomerDetails = async () => {
    // Validate customer ID
    if (!customerId || isNaN(Number(customerId))) {
      setError('Invalid customer ID provided');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const response = await API._get(`/customers/${customerId}`);
      
      if (!response.data?.data) {
        throw new Error('Customer not found');
      }
      setCustomer(response.data.data);
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load customer');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCustomerDetails();
  };

  const handleEdit = () => {
    navigation.navigate('CustomerForm', { 
      customer: JSON.stringify(customer),
      onGoBack: fetchCustomerDetails
    });
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Customer',
      'Are you sure you want to delete this customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await API._delete(`/customers/${customerId}`);
              Alert.alert('Success', 'Customer deleted');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Delete failed');
            }
          }
        }
      ]
    );
  };

  const handleServiceHistory = () => {
    navigation.navigate('ServiceHistoryList', { 
      customerId: customer.id,
      customerName: customer.customerName 
    });
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading customer details...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Icon name="alert-circle" size={40} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <Button 
            mode="contained" 
            onPress={handleRefresh}
            style={styles.button}
            icon="refresh"
          >
            Retry
          </Button>
        </View>
      );
    }

    if (!customer) {
      return (
        <View style={styles.center}>
          <Icon name="account-question" size={40} color={colors.text} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Customer not found
          </Text>
          <Button 
            mode="outlined" 
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            Go Back
          </Button>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <View style={styles.header}>
              <Title style={[styles.title, { color: colors.primary }]}>
                {customer.customerName}
              </Title>
              <Icon name="account" size={24} color={colors.primary} />
            </View>

            <View style={styles.detailRow}>
              <Icon name="identifier" size={20} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                ID: {customer.id}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon name="phone" size={20} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Mobile: {customer.mobile || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon name="car" size={20} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Vehicles: {customer.vehicles || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon name="calendar" size={20} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Registered: {customer.regDate ? new Date(customer.regDate).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleServiceHistory}
            style={styles.button}
            icon="history"
            contentStyle={styles.buttonContent}
          >
            Service History
          </Button>

          <Button
            mode="outlined"
            onPress={handleEdit}
            style={styles.button}
            icon="pencil"
            contentStyle={styles.buttonContent}
          >
            Edit Customer
          </Button>

          <Button
            mode="outlined"
            onPress={handleDelete}
            style={[styles.button, { borderColor: colors.error }]}
            textColor={colors.error}
            icon="delete"
            contentStyle={styles.buttonContent}
          >
            Delete Customer
          </Button>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Customer Details" />
        {customer && (
          <>
            <Appbar.Action 
              icon="refresh" 
              onPress={handleRefresh} 
              color={colors.primary}
            />
            <Appbar.Action 
              icon="pencil" 
              onPress={handleEdit} 
              color={colors.primary}
            />
          </>
        )}
      </Appbar.Header>
      
      {renderContent()}
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
    padding: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 8,
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    marginVertical: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  actions: {
    marginTop: 16,
  },
  button: {
    marginVertical: 8,
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
});

export default CustomerDetailScreen;