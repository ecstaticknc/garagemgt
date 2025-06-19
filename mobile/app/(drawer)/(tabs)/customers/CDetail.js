// screens/Customer/CustomerDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Appbar, Card, Title, Paragraph, ActivityIndicator, Text, Button, useTheme } from 'react-native-paper';
import API from '../../../config/axiosInstance';
import { useNavigation, useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CustomerDetailScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { colors } = theme;
  const params = useLocalSearchParams();
  const customerId = params.id || 4; // Get from params or use default for testing

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!customerId) {
        setError('Invalid customer ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await API._get(`/customers/${customerId}`);
        if (!response.data?.data) {
          throw new Error('Customer data not found');
        }
        setCustomer(response.data.data);
      } catch (err) {
        console.error('Error fetching customer details:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load customer details');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [customerId]);

  const handleEdit = () => {
    if (!customer) return;
    navigation.navigate('CustomerForm', { customer: JSON.stringify(customer) });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator animating={true} size="large" color={colors.primary} />
          <Text style={{ marginTop: 10, color: colors.text }}>Loading Customer Details...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Icon name="alert-circle" size={40} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.goBack()}
            style={{ marginTop: 20 }}
          >
            Go Back
          </Button>
        </View>
      );
    }

    if (!customer) {
      return (
        <View style={styles.center}>
          <Icon name="account-question" size={40} color={colors.primary} />
          <Text style={{ marginBottom: 20, color: colors.text }}>Customer not found</Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.goBack()}
            style={{ marginTop: 20 }}
          >
            Go Back
          </Button>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Title style={[styles.title, { color: colors.primary }]}>{customer.customerName}</Title>
              <Icon name="account" size={24} color={colors.primary} />
            </View>
            
            <View style={styles.detailRow}>
              <Icon name="identifier" size={20} color={colors.onSurfaceVariant} />
              <Paragraph style={styles.detailText}>
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>ID: </Text>
                {customer.id}
              </Paragraph>
            </View>

            <View style={styles.detailRow}>
              <Icon name="phone" size={20} color={colors.onSurfaceVariant} />
              <Paragraph style={styles.detailText}>
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Mobile: </Text>
                {customer.mobile || 'N/A'}
              </Paragraph>
            </View>

            <View style={styles.detailRow}>
              <Icon name="car" size={20} color={colors.onSurfaceVariant} />
              <Paragraph style={styles.detailText}>
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Vehicles: </Text>
                {customer.vehicles || 'N/A'}
              </Paragraph>
            </View>

            <View style={styles.detailRow}>
              <Icon name="calendar" size={20} color={colors.onSurfaceVariant} />
              <Paragraph style={styles.detailText}>
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Registration: </Text>
                {customer.regDate ? customer.regDate.split('T')[0] : 'N/A'}
              </Paragraph>
            </View>

            <View style={styles.detailRow}>
              <Icon name="garage" size={20} color={colors.onSurfaceVariant} />
              <Paragraph style={styles.detailText}>
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Service Center: </Text>
                {customer.scId || 'N/A'}
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={() => navigation.navigate('ServiceHistoryList', { customerId: customer.id })}
          style={[styles.button, { marginTop: 16 }]}
          icon="history"
          contentStyle={styles.buttonContent}
        >
          View Service History
        </Button>

        <Button
          mode="outlined"
          onPress={handleEdit}
          style={[styles.button, { marginTop: 12 }]}
          icon="pencil"
          contentStyle={styles.buttonContent}
        >
          Edit Customer
        </Button>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Customer Details" />
        {customer && (
          <Appbar.Action 
            icon="pencil" 
            onPress={handleEdit} 
            color={colors.primary}
          />
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
    paddingBottom: 24,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  headerRow: {
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
    fontSize: 15,
  },
  label: {
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    marginVertical: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
});

export default CustomerDetailScreen;