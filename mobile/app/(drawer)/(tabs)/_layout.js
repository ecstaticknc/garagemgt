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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { loggedInUser } = useAuth();

  //console.log("Logged usr role in layout", loggedInUser)

  const isAdmin = loggedInUser && loggedInUser.role === 'admin';

  // Drawer button animation
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

  // Start pulse loop animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Helper: Conditionally animate only the focused tab icon
  const getAnimatedIcon = (iconComponent, focused) => {
    if (focused) {
      return <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>{iconComponent}</Animated.View>;
    }
    return iconComponent;
  };

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
          tabBarIcon: ({ color, size, focused }) =>
            getAnimatedIcon(<MaterialIcons name="home" size={size} color={color} />, focused),
        }}
      />


      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color, size, focused }) =>
            getAnimatedIcon(<FontAwesome name="users" size={size} color={color} />, focused),
          href: isAdmin ? null : undefined,
        }}
      />



      <Tabs.Screen
        name="servicehistory"
        options={{
          title: 'Service\nHistory',
          tabBarIcon: ({ color, size, focused }) =>
            getAnimatedIcon(<FontAwesome5 name="history" size={size} color={color} />, focused),
           href: isAdmin ? null : undefined,
        }}
      />



      <Tabs.Screen
        name="Reminder"
        options={{
          title: 'Reminder',
          tabBarIcon: ({ color, size, focused }) =>
            getAnimatedIcon(<FontAwesome5 name="bell" size={size} color={color} />, focused),
           href: isAdmin ? null : undefined
        }}
      />

      <Tabs.Screen
        name="servicecenters"
        options={{
          title: 'Service\nCenters',
          tabBarIcon: ({ color, size, focused }) =>
            getAnimatedIcon(<MaterialCommunityIcons name="garage" size={size} color={color} />, focused),
         href: isAdmin ? undefined : null
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
    textAlign: 'center',
    lineHeight: 16,
    flexWrap: 'wrap',
    width: 70,
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
