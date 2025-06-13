// components/CustomDrawerContent.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Button, Text, Divider, Avatar } from 'react-native-paper';
import { useAuth } from '../context/AuthContext'; // To access the logout function
import { useEffect, useState } from 'react';
import { _get } from '../config/axiosInstance'; // To fetch service center details

const CustomDrawerContent = (props) => {
  console.log("in custom ",props)
  const { logout, userScId } = useAuth();
  const [serviceCenterInfo, setServiceCenterInfo] = useState(null);
  const [loadingScInfo, setLoadingScInfo] = useState(true);

  useEffect(() => {
    const fetchServiceCenterInfo = async () => {
      if (userScId) {
        try {
          setLoadingScInfo(true);
          // Assuming you have an API endpoint like /api/servicecenters/:id
          const response = await _get(`/servicecenters/${userScId}`);
          setServiceCenterInfo(response.data.data); // Adjust based on your API response structure
        } catch (error) {
          console.error("Failed to fetch service center info for drawer:", error);
          setServiceCenterInfo(null);
        } finally {
          setLoadingScInfo(false);
        }
      }
    };
    fetchServiceCenterInfo();
  }, [userScId]);

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <View style={styles.drawerHeader}>
          <Avatar.Icon size={50} icon="account-circle" style={styles.avatar} />
          {loadingScInfo ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : serviceCenterInfo ? (
            <>
              <Text style={styles.proprietorName}>{serviceCenterInfo.proprietorName}</Text>
              <Text style={styles.serviceCenterName}>{serviceCenterInfo.serviceCenterName}</Text>
              <Text style={styles.serviceCenterMobile}>{serviceCenterInfo.proprietorMobile}</Text>
            </>
          ) : (
            <Text style={styles.noInfoText}>Service Center Info Not Found</Text>
          )}
        </View>
        <Divider />
        <DrawerItemList {...props} />
        <Divider />
        <View style={styles.logoutContainer}>
          <Button icon="logout" mode="contained" onPress={logout} style={styles.logoutButton}>
            Logout
          </Button>
        </View>
      </DrawerContentScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#007bff', // Your primary color
    marginBottom: 10,
  },
  avatar: {
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  proprietorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  serviceCenterName: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 2,
  },
  serviceCenterMobile: {
    fontSize: 14,
    color: '#eee',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  noInfoText: {
    color: '#fff',
    marginTop: 10,
  },
  logoutContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  logoutButton: {
    backgroundColor: '#dc3545', // Red for logout
  },
});

export default CustomDrawerContent;