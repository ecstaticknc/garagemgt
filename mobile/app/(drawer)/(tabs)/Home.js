// screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import {  List, Divider, Text, Card } from 'react-native-paper';
import { useAuth } from '../../../context/AuthContext'; // To get userScId
import API from '../../config/axiosInstance'; // To make API calls
import { useNavigation, useRouter } from 'expo-router';

export default function Home() {
  const navigation = useNavigation(); // Use useNavigation hook from expo-router
  const router = useRouter(); // Use useRouter for navigating to expo-router paths

  const { userScId, logout } = useAuth();
  const [serviceCenterInfo, setServiceCenterInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    const fetchServiceCenterData = async () => {
      if (userScId) {
        try {
          setLoadingInfo(true);
          setErrorInfo(null);
          const response = await API._get(`/servicecenters/${userScId}`);
          console.log("Service Center Data:", response.data.data); 
          setServiceCenterInfo(response.data.data);

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
  }, [userScId]);

  return (
    <View style={styles.container}>
      

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

       
      </View>
    </View>
  );
}

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
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
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