// screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Appbar, List, Divider, Text, Card } from 'react-native-paper';
import { useAuth } from '../../../context/AuthContext'; // To get userScId
import { _get } from '../../../config/axiosInstance'; // To make API calls

const HomeScreen = ({ navigation }) => {
  const { userScId, logout } = useAuth(); // Get userScId and logout function
  const [serviceCenterInfo, setServiceCenterInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    const fetchServiceCenterData = async () => {
      if (userScId) {
        try {
          setLoadingInfo(true);
          setErrorInfo(null);
          // Assuming you have an API endpoint to get service center details by ID
          const response = await _get(`/servicecenters/${userScId}`);
          setServiceCenterInfo(response.data.data); // Adjust based on your API response
        } catch (error) {
          console.error("Failed to fetch service center data for dashboard:", error);
          setErrorInfo("Failed to load service center details.");
        } finally {
          setLoadingInfo(false);
        }
      } else {
        setServiceCenterInfo(null);
        setLoadingInfo(false);
      }
    };

    fetchServiceCenterData();
  }, [userScId]); // Re-fetch if userScId changes

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} /> {/* Open drawer */}
        <Appbar.Content title="Dashboard" />
        {/* You can add a logout button here too if desired, or keep it only in the drawer */}
        {/* <Appbar.Action icon="logout" onPress={logout} /> */}
      </Appbar.Header>

      <View style={styles.content}>
        {loadingInfo ? (
          <ActivityIndicator size="large" style={styles.loadingIndicator} />
        ) : errorInfo ? (
          <Text style={styles.errorText}>{errorInfo}</Text>
        ) : serviceCenterInfo ? (
          <Card style={styles.infoCard}>
            <Card.Title
              title={`Welcome, ${serviceCenterInfo.proprietorName}!`}
              subtitle={`Service Center: ${serviceCenterInfo.serviceCenterName}`}
              left={(props) => <List.Icon {...props} icon="tools" />}
            />
            <Card.Content>
              <Text>Mobile: {serviceCenterInfo.proprietorMobile}</Text>
              <Text>Email: {serviceCenterInfo.proprietorEmail}</Text>
              <Text>Address: {serviceCenterInfo.serviceCenterAddress}</Text>
            </Card.Content>
          </Card>
        ) : (
          <Text style={styles.noInfoText}>No service center information available.</Text>
        )}

        <List.Section style={styles.listSection}>
          <List.Subheader>Quick Navigation</List.Subheader>
          {/* These will now navigate to the appropriate screens within the tabs */}
          <List.Item
            title="Customers"
            description="Manage customer details"
            left={() => <List.Icon icon="account-group" />}
            onPress={() => navigation.navigate('CustomersTab')} // Navigate to the Customers tab
          />
          <Divider />
          <List.Item
            title="Service History"
            description="View and add service records"
            left={() => <List.Icon icon="history" />}
            onPress={() => navigation.navigate('HistoryTab')} // Navigate to the History tab
          />
          <Divider />
          <List.Item
            title="Manage Service Centers"
            description="Access all service center data"
            left={() => <List.Icon icon="car-wrench" />}
            onPress={() => navigation.navigate('ServiceCenterList')} // Navigate directly to this screen (can be in drawer too)
          />
        </List.Section>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingIndicator: {
    marginTop: 50,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  noInfoText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'gray',
  },
  infoCard: {
    marginBottom: 20,
    elevation: 4, // Shadow for Android
    shadowOffset: { width: 0, height: 2 }, // Shadow for iOS
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  listSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

export default HomeScreen;