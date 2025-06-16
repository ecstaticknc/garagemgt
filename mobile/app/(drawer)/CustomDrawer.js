// CustomDrawer.js
import React, { useEffect, useState } from 'react';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, Image, Alert, BackHandler } from 'react-native';
import { Feather, Entypo, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useAuth } from './../../context/AuthContext'; 
import API from '../config/axiosInstance'; 

export default function CustomDrawer(props) {
  const router = useRouter();
  const pathname = usePathname();

  const { userScId, loggedInUser, logout } = useAuth();

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

  const handleExitApp = () => {
    Alert.alert(
      "अ‍ॅप बंद करा",
      "तुम्हाला अ‍ॅप बंद करायचे आहे का?",
      [
        { text: "रद्द करा", style: "cancel" },
        {
          text: "होय",
          onPress: () => {
            logout(); // Clears AuthContext
            router.replace('/'); // Navigates to login screen
            // Optional: If you need to forcefully exit the app, though generally not recommended in React Native
            // BackHandler.exitApp();
          }
        }
      ],
      { cancelable: false }
    );
  };

  // Helper function to check if the current route is active
  // This now checks against the full path or a significant part of it
  const isRouteActive = (routePath) => {
    // pathname example: / (for index), /Home, /CustomerDetailScreen, /CustomerListScreen etc.
    // Ensure `routePath` matches the expected segment of your Expo Router file system routing.
    // For example, if your file is `app/(drawer)/(tabs)/CustomerListScreen.js`, the pathname segment is 'CustomerListScreen'.
    return pathname.includes(routePath);
  };

  // Consistent colors
  const ACTIVE_COLOR = "#FF8C00"; // Saffron color
  const INACTIVE_COLOR = "#4a4a4a";

  const showAdminFeatures = loggedInUser && loggedInUser.role === 'admin';

  return (
    <View style={styles.container}>
      <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContainer}
        drawerHideStatusBarOnOpen={true}
      >
        {/* User Profile Section */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo1.png')}
            style={styles.avatar}
          />
          <Text style={styles.appNameHeader}>बाईक क्लिनिक</Text>
          {loggedInUser ? (
            <>
              <Text style={styles.loggedInUserName}>
                नमस्कार, {loggedInUser.username}!
              </Text>
              <Text style={styles.loggedInUserRole}>
                पद: {loggedInUser.role}
              </Text>
            </>
          ) : (
            <Text style={styles.loggedInUserName}>
              {serviceCenterInfo?.proprietorName}
            </Text>
          )}
        </View>

        {/* Main Navigation Items */}
        <View style={styles.menuSection}>
          <DrawerItem
            label="डॅशबोर्ड"
            icon={({ size }) => (
              <Feather
                name="home"
                size={size}
                color={isRouteActive('Home') ? ACTIVE_COLOR : INACTIVE_COLOR} // Corrected to 'Home' (capital H)
              />
            )}
            onPress={() => router.navigate('/(drawer)/(tabs)/Home')} // Corrected to 'Home' (capital H)
            labelStyle={[
              styles.label,
              { color: isRouteActive('Home') ? ACTIVE_COLOR : INACTIVE_COLOR }
            ]}
            style={[
              styles.menuItem,
              isRouteActive('Home') && styles.activeItem
            ]}
          />

          

          {/* Service Center Management - Re-added as per Home.js options */}
          <DrawerItem
            label="सर्व्हिस सेंटर व्यवस्थापन"
            icon={({ size }) => (
              <MaterialCommunityIcons
                name="car-wrench" // Icon for service center
                size={size}
                color={isRouteActive('SCList') ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            )}
            onPress={() => router.navigate('servicecenters/SCList')}
            labelStyle={[
              styles.label,
              { color: isRouteActive('ServiceCenterListScreen') ? ACTIVE_COLOR : INACTIVE_COLOR }
            ]}
            style={[
              styles.menuItem,
              isRouteActive('ServiceCenterListScreen') && styles.activeItem
            ]}
          />

          {/* Service History List - Re-added as per Home.js options */}
          <DrawerItem
            label="सेवा इतिहास"
            icon={({ size }) => (
              <MaterialIcons
                name="history" // Icon for service history
                size={size}
                color={isRouteActive('ServiceHistoryListScreen') ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            )}
            onPress={() => router.navigate('servicehistory/SHList')}
            labelStyle={[
              styles.label,
              { color: isRouteActive('ServiceHistoryListScreen') ? ACTIVE_COLOR : INACTIVE_COLOR }
            ]}
            style={[
              styles.menuItem,
              isRouteActive('ServiceHistoryListScreen') && styles.activeItem
            ]}
          />

          {/* New "Reset Database" Drawer Item */}
          {showAdminFeatures && (
            <DrawerItem
              label="डेटाबेस रीसेट करा"
              icon={({ size }) => (
                <MaterialCommunityIcons // Using MaterialCommunityIcons for 'database-remove'
                  name="database-remove"
                  size={size}
                  color={isRouteActive('ResetDatabaseScreen') ? ACTIVE_COLOR : INACTIVE_COLOR} // Corrected to 'ResetDatabaseScreen'
                />
              )}
              onPress={() => router.navigate('/(drawer)/(tabs)/ResetDatabaseScreen')} // Navigate to the new screen
              labelStyle={[
                styles.label,
                { color: isRouteActive('ResetDatabaseScreen') ? ACTIVE_COLOR : INACTIVE_COLOR }
              ]}
              style={[
                styles.menuItem,
                isRouteActive('ResetDatabaseScreen') && styles.activeItem
              ]}
            />
          )}

        </View>
      </DrawerContentScrollView>

      {/* Footer Section */}
      <View style={styles.footer}>
        <BlurView intensity={80} tint="light" style={styles.footerBlur}>
          <DrawerItem
            label="अ‍ॅपमधून बाहेर पडा"
            icon={({ size }) => (
              <Entypo name="log-out" size={size} color="#e74c3c" />
            )}
            onPress={handleExitApp}
            labelStyle={[styles.label, styles.exitLabel]}
            style={styles.menuItem}
          />
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(173, 127, 88, 0.3)',
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#AD7F58',
  },
  appNameHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'Mukta-Regular',
  },
  loggedInUserName: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    fontFamily: 'Mukta-Regular',
    marginTop: 5,
  },
  loggedInUserRole: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    fontFamily: 'Mukta-Regular',
  },
  menuSection: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  menuItem: {
    borderRadius: 15,
    marginVertical: 4,
    justifyContent: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginLeft: 10,
    width: '100%',
    fontFamily: 'Mukta-Regular',
  },
  activeItem: {
    backgroundColor: 'rgba(255, 140, 0, 0.16)',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderColor: '#FF8C00',
  },
  exitLabel: {
    color: '#e74c3c',
  },
  footer: {
    padding: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(173, 127, 88, 0.3)',
  },
  footerBlur: {
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
});