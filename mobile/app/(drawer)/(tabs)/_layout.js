import { Tabs } from 'expo-router/tabs';
import { useNavigation } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { useRef, useEffect } from 'react';

export default function TabLayout() {
  const navigation = useNavigation();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const drawerButton = () => (
    <TouchableOpacity
      onPress={() => {
        // Add animation when drawer button is pressed
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

      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers', // Changed from ग्राहक to English
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="users" size={size} color={color} />
          ),
          headerShown: true,
        }}
      />

      <Tabs.Screen
        name="servicecenters"
        options={{
          title: 'Service Centers', // Changed from सेवा केन्द्र to English
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="garage" size={size} color={color} />
          ),
          headerShown: true,
        }}
      />

      <Tabs.Screen
        name="servicehistory"
        options={{
          title: 'Service History',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="history" size={size} color={color} />
          ),
          headerShown: true,
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
  drawerButton: {
    marginLeft: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,53,0.1)',
  },
});