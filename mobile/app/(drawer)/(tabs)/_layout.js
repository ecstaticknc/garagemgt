import { Tabs } from 'expo-router/tabs';
import { useNavigation } from 'expo-router';
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRef, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

export default function TabLayout() {
  const navigation = useNavigation();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { loggedInUser } = useAuth();

  const showServiceCentersTab = loggedInUser && loggedInUser.role === 'admin';

  const drawerButton = () => (
    <TouchableOpacity
      onPress={() => {
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start(() => navigation.openDrawer());
      }}
      style={{ marginLeft: 15 }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons name="menu" size={28} color="#333" />
      </Animated.View>
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#4A4A4A',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTitleAlign: 'center',
        headerLeft: drawerButton,
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />

      {!showServiceCentersTab && (
        <Tabs.Screen
          name="customers"
          options={{
            title: 'Customers',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="users" size={size} color={color} />
            ),
          }}
        />
      )}

      {!showServiceCentersTab && (
        <Tabs.Screen
          name="servicehistory"
          options={{
            title: 'Service History',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="history" size={size} color={color} />
            ),
          }}
        />
      )}

      

      {/* Service Centers tab - conditionally shown in tab bar */}
      <Tabs.Screen
        name="servicecenters"
        options={{
          title: 'Service Centers',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="garage" size={size} color={color} />
          ),
          // Hide from tab bar if user is not admin
          tabBarButton: () => showServiceCentersTab ? undefined : null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 5,
    height: 65,
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  header: {
    backgroundColor: '#FFFFFF',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});