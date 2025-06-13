// screens/Customer/CustomerDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Appbar, Card, Title, Paragraph, ActivityIndicator, Text, Button } from 'react-native-paper';
import { _get } from '../../config/axiosInstance';

const CustomerDetailScreen = ({ navigation, route }) => {
  const { customerId } = route.params;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await _get(`/customers/${customerId}`);
        setCustomer(response.data.data);
      } catch (err) {
        console.error('Error fetching customer details:', err);
        setError('Failed to load customer details. Please try again.');
        Alert.alert('Error', 'Failed to load customer details.');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerDetails();
  }, [customerId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating={true} size="large" />
        <Text>Loading Customer Details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.center}>
        <Text>Customer not found.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Customer Details" />
        <Appbar.Action icon="pencil" onPress={() => navigation.navigate('CustomerForm', { customer: customer })} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>{customer.customerName}</Title>
            <Paragraph>
              <Text style={styles.label}>ID:</Text> {customer.id}
            </Paragraph>
            <Paragraph>
              <Text style={styles.label}>Mobile:</Text> {customer.mobile}
            </Paragraph>
            <Paragraph>
              <Text style={styles.label}>Vehicles:</Text> {customer.vehicles || 'N/A'}
            </Paragraph>
            <Paragraph>
              <Text style={styles.label}>Registration Date:</Text> {customer.regDate ? customer.regDate.split('T')[0] : 'N/A'}
            </Paragraph>
            <Paragraph>
              <Text style={styles.label}>Service Center ID:</Text> {customer.scId || 'N/A'}
            </Paragraph>
          </Card.Content>
        </Card>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('ServiceHistoryList', { customerId: customer.id })}
          style={styles.button}
        >
          View Service History
        </Button>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    marginTop: 10,
  }
});

export default CustomerDetailScreen;