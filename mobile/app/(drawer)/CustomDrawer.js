import React, { useEffect, useState } from 'react';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, Image, Alert, TouchableOpacity, Animated } from 'react-native';
import { Feather, Entypo, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from './../../context/AuthContext';
import API from '../config/axiosInstance';

const COLORS = {
  primary: '#6B42F6',
  secondary: '#8A5DFE',
  accent: '#FFD700',
  background: '#F0F2F5',
  text: '#344054',
  lightText: '#667085',
  card: '#FFFFFF',
  border: '#EAECF0',
  danger: '#F04438',
  success: '#12B76A',
};

export default function CustomDrawer(props) {
  const router = useRouter();
  const pathname = usePathname();
  const { userScId, loggedInUser, logout } = useAuth();
  const [serviceCenterInfo, setServiceCenterInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    const fetchServiceCenterData = async () => {
      if (userScId) {
        try {
          setLoadingInfo(true);
          setErrorInfo(null);
          const response = await API._get(`/servicecenters/${userScId}`);
          setServiceCenterInfo(response.data.data);
        } catch (error) {
          console.error("Failed to fetch service center data:", error);
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

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleExitApp = () => {
    Alert.alert(
      "Exit App",
      "Are you sure you want to exit the app?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
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

  // Determine if the user is an admin
  const showAdminFeatures = loggedInUser && loggedInUser.role === 'admin';

  const MenuItem = ({ label, iconName, routePath, iconLib = 'Feather' }) => {
    const isActive = isRouteActive(routePath);
    const IconComponent = {
      Feather,
      MaterialIcons,
      MaterialCommunityIcons,
      Entypo,
    }[iconLib];

    return (
      <TouchableOpacity
        onPress={() => router.navigate(routePath)}
        style={[
          styles.menuItem,
          isActive && styles.activeItem,
          isActive && { transform: [{ scale: pulseAnim }] } // Apply animation when active
        ]}
      >
        <View style={styles.menuItemContent}>
          <IconComponent
            name={iconName}
            size={22}
            color={isActive ? COLORS.primary : COLORS.lightText}
            style={styles.menuIcon}
          />
          <Text style={[
            styles.menuLabel,
            { color: isActive ? COLORS.primary : COLORS.text }
          ]}>
            {label}
          </Text>
        </View>
        {isActive && (
          <View style={[styles.activeIndicator, { backgroundColor: COLORS.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <LinearGradient
        colors={['rgba(66, 114, 246, 0.03)', 'rgba(107, 66, 246, 0.01)']}
        style={StyleSheet.absoluteFill}
      />
      <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image source={require('../../assets/logo1.png')} style={styles.avatar} />
            <View style={styles.onlineIndicator} />
          </View>

          <Text style={styles.appName}>Bike Clinic</Text>

          {loggedInUser ? (
            <>
              {(loggedInUser?.proprietorName || serviceCenterInfo?.proprietorName) && (
                <Text style={styles.proprietorName}>
                  {loggedInUser?.proprietorName || serviceCenterInfo?.proprietorName}
                </Text>
              )}
            </>
          ) :
            (
              <Text style={styles.userName}>{serviceCenterInfo?.proprietorName}</Text>
            )}

        </LinearGradient>

        <View style={styles.menuContainer}>
          {/* Dashboard is always visible */}
          <MenuItem label="Dashboard" iconName="home" routePath="/(drawer)/(tabs)/Home" />

          {/* Service Center Management - Only for Admins */}
          {showAdminFeatures && (
            <MenuItem
              label="Service Center Management"
              iconName="car-wrench"
              routePath="servicecenters/SCList"
              iconLib="MaterialCommunityIcons"
            />
          )}

           {/* Service History - Only for Normal Users */}
          {!showAdminFeatures && (
            <MenuItem
              label="Customers"
              iconName="group"
              routePath="customers/CList"
              iconLib="MaterialIcons"
            />
          )}

          {/* Service History - Only for Normal Users */}
          {!showAdminFeatures && (
            <MenuItem
              label="Service History"
              iconName="history"
              routePath="servicehistory/SHList"
              iconLib="MaterialIcons"
            />
          )}

          {/* Reminder - Only for Normal Users */}
          {!showAdminFeatures && (
            <MenuItem
              label="Reminder"
              iconName="bell"
              routePath="/(drawer)/(tabs)/Reminder"
              iconLib="Feather"
            />
          )}

        </View>
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleExitApp} style={styles.logoutButton}>
          <LinearGradient
            colors={['rgba(240, 68, 56, 0.1)', 'rgba(247, 104, 94, 0.42)']}
            style={styles.logoutGradient}>
            <Entypo name="log-out" size={20} color={COLORS.danger} />
            <Text style={[styles.logoutText, { color: COLORS.danger }]}>Exit App</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingTop: 10,
  },
  profileCard: {
    padding: 28,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarContainer: {
    width: 95,
    height: 95,
    borderRadius: 47.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    position: 'relative',
  },
  avatar: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
  },
  onlineIndicator: {
    position: 'absolute',
    right: 7,
    bottom: 7,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#12B76A',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  userName: {
    fontSize: 19,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 6,
  },
  proprietorName: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 10,
  },
  roleBadge: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 25,
    marginTop: 10,
  },
  roleText: {
    fontSize: 13,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  menuContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  menuItem: {
    borderRadius: 15,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeItem: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#6B42F6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderColor: '#6B42F6',
    borderWidth: 1,
  },
  menuIcon: {
    marginRight: 18,
    width: 22,
    textAlign: 'center',
  },
  menuLabel: {
    fontSize: 17,
    flex: 1,
  },
  activeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
     },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
  },
  logoutButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
  },
  logoutGradient: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 17,
  },
  versionText: {
    textAlign: 'center',
    color: '#667085',
    fontSize: 14,
  },
});