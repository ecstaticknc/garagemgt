import { Tabs } from 'expo-router/tabs';
import { useNavigation } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome, Entypo, MaterialCommunityIcons,FontAwesome6, FontAwesome5 } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const navigation = useNavigation();

  const drawerButton = () => (
    <TouchableOpacity
      onPress={() => {
        navigation.openDrawer();
      }}
      style={{ marginLeft: 15 }}>
      <Ionicons name="menu" size={28} color="black" />
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFC53D',
        tabBarInactiveTintColor: '#000',
        tabBarStyle: {
          backgroundColor: '#FDFDF9',
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#FDFDF9',
        },
        headerTitleAlign: 'center',
        headerLeft: drawerButton,
      }}>
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
        name="customers" // Points to app/(tabs)/customers/_layout.js
        options={{
          title: 'ग्राहक', // A more general title for the Customer tab
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="users" size={size} color={color} /> // Changed to a more suitable icon for "Customers"
          ),
          headerShown: true, // The nested stack will handle its own headers
        }}
      />
      <Tabs.Screen
        name="servicecenters" // Points to app/(tabs)/servicecenters/_layout.js
        options={{
          title: 'सेवा केन्द्र',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="garage" size={size} color={color} />
          ),
          headerShown: true, // The nested stack will handle its own headers
        }}
      />
      <Tabs.Screen
        name="servicehistory" // Points to app/(tabs)/servicehistory/_layout.js
        options={{
          title: 'सेवा इतिहास',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="history" size={size} color={color} />
          ),
          headerShown: true, // The nested stack will handle its own headers
        }}
      />
     
    


       
    </Tabs>
  );
}