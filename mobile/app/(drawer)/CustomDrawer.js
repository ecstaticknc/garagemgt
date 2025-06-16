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
            logout();
            router.replace('/');
          }
        }
      ],
      { cancelable: false }
    );
  };

  const isRouteActive = (routePath) => {
    return pathname.includes(routePath);
  };

  // Updated color scheme
  const ACTIVE_COLOR = "#FF6B35"; // Vibrant orange
  const INACTIVE_COLOR = "#4A4E69"; // Dark blue-gray
  const BACKGROUND_COLOR = "#F7F7FF"; // Light off-white
  const TEXT_COLOR = "#252627"; // Dark gray
  const ACCENT_COLOR = "#1985A1"; // Teal blue

  const showAdminFeatures = loggedInUser && loggedInUser.role === 'admin';

  return (
    <View style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContainer}
        drawerHideStatusBarOnOpen={true}
      >
        {/* User Profile Section - Updated Design */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/logo1.png')}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.appNameHeader}>बाईक क्लिनिक</Text>
          {loggedInUser ? (
            <>
              <Text style={styles.loggedInUserName}>
                नमस्कार, {loggedInUser.username}!
              </Text>
              <View style={styles.roleBadge}>
                <Text style={styles.loggedInUserRole}>
                  {loggedInUser.role}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.loggedInUserName}>
              {serviceCenterInfo?.proprietorName}
            </Text>
          )}
        </View>

        {/* Main Navigation Items - Updated Styling */}
        <View style={styles.menuSection}>
          <DrawerItem
            label="डॅशबोर्ड"
            icon={({ size }) => (
              <Feather
                name="home"
                size={size}
                color={isRouteActive('Home') ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            )}
            onPress={() => router.navigate('/(drawer)/(tabs)/Home')}
            labelStyle={[
              styles.label,
              { 
                color: isRouteActive('Home') ? ACTIVE_COLOR : INACTIVE_COLOR,
                fontFamily: 'Mukta-SemiBold'
              }
            ]}
            style={[
              styles.menuItem,
              isRouteActive('Home') && styles.activeItem
            ]}
          />

          <DrawerItem
            label="सर्व्हिस सेंटर व्यवस्थापन"
            icon={({ size }) => (
              <MaterialCommunityIcons
                name="car-wrench"
                size={size}
                color={isRouteActive('SCList') ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            )}
            onPress={() => router.navigate('servicecenters/SCList')}
            labelStyle={[
              styles.label,
              { 
                color: isRouteActive('ServiceCenterListScreen') ? ACTIVE_COLOR : INACTIVE_COLOR,
                fontFamily: 'Mukta-SemiBold'
              }
            ]}
            style={[
              styles.menuItem,
              isRouteActive('ServiceCenterListScreen') && styles.activeItem
            ]}
          />

          <DrawerItem
            label="सेवा इतिहास"
            icon={({ size }) => (
              <MaterialIcons
                name="history"
                size={size}
                color={isRouteActive('ServiceHistoryListScreen') ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            )}
            onPress={() => router.navigate('servicehistory/SHList')}
            labelStyle={[
              styles.label,
              { 
                color: isRouteActive('ServiceHistoryListScreen') ? ACTIVE_COLOR : INACTIVE_COLOR,
                fontFamily: 'Mukta-SemiBold'
              }
            ]}
            style={[
              styles.menuItem,
              isRouteActive('ServiceHistoryListScreen') && styles.activeItem
            ]}
          />

          {showAdminFeatures && (
            <DrawerItem
              label="डेटाबेस रीसेट करा"
              icon={({ size }) => (
                <MaterialCommunityIcons
                  name="database-remove"
                  size={size}
                  color={isRouteActive('ResetDatabaseScreen') ? ACTIVE_COLOR : INACTIVE_COLOR}
                />
              )}
              onPress={() => router.navigate('/(drawer)/(tabs)/ResetDatabaseScreen')}
              labelStyle={[
                styles.label,
                { 
                  color: isRouteActive('ResetDatabaseScreen') ? ACTIVE_COLOR : INACTIVE_COLOR,
                  fontFamily: 'Mukta-SemiBold'
                }
              ]}
              style={[
                styles.menuItem,
                isRouteActive('ResetDatabaseScreen') && styles.activeItem
              ]}
            />
          )}
        </View>
      </DrawerContentScrollView>

      {/* Footer Section - Updated Design */}
      <View style={styles.footer}>
        <BlurView intensity={80} tint="light" style={styles.footerBlur}>
          <DrawerItem
            label="अ‍ॅपमधून बाहेर पडा"
            icon={({ size }) => (
              <Entypo name="log-out" size={size} color="#E71D36" />
            )}
            onPress={handleExitApp}
            labelStyle={[styles.label, styles.exitLabel]}
            style={[styles.menuItem, styles.exitButton]}
          />
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 10,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 78, 105, 0.1)',
    marginBottom: 10,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#FF6B35',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  appNameHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#252627',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Mukta-Bold',
  },
  loggedInUserName: {
    fontSize: 16,
    color: '#4A4E69',
    textAlign: 'center',
    fontFamily: 'Mukta-Medium',
    marginTop: 5,
  },
  roleBadge: {
    backgroundColor: '#1985A1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginTop: 8,
  },
  loggedInUserRole: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Mukta-SemiBold',
  },
  menuSection: {
    marginTop: 15,
    paddingHorizontal: 15,
  },
  menuItem: {
    borderRadius: 12,
    marginVertical: 5,
    justifyContent: 'center',
    height: 50,
    overflow: 'hidden',
  },
  label: {
    fontSize: 16,
    textAlign: 'left',
    marginLeft: -10,
    fontFamily: 'Mukta-Medium',
  },
  activeItem: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderLeftWidth: 5,
    borderLeftColor: '#FF6B35',
  },
  exitLabel: {
    color: '#E71D36',
    fontFamily: 'Mukta-SemiBold',
  },
  exitButton: {
    backgroundColor: 'rgba(231, 29, 54, 0.1)',
  },
  footer: {
    padding: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(74, 78, 105, 0.1)',
  },
  footerBlur: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
});