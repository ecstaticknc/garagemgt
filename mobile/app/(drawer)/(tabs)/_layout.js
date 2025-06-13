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
        name="home"
        options={{
          title: 'डॅशबोर्ड',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="BookingView"       
        options={{
          title: 'बुकिंग व्यवस्थापन',         
   
          tabBarIcon: ({ color, size }) => (
           <FontAwesome5 name="calendar-alt" size={28} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="customeradd"
        options={{
          title: 'ग्राहक नोंदणी',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user-plus" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="customerlist"
        options={{
          title: 'आगामी बुकिंग',
          tabBarIcon: ({ color, size }) => (
            // <FontAwesome name="list-alt" size={28} color={color} />
            <MaterialIcons name="event-available" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="CompletedEvents"
        options={{
          title: 'पूर्ण कार्यक्रम',
          headerShown: true,
          tabBarShowLabel: true,
          tabBarIcon: ({ color, size }) => (
           <MaterialIcons name="event-busy" size={28} color={color} />
            // <MaterialCommunityIcons name="playlist-check" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ItemManagement"
        options={{
          href:null,
          title: 'सामग्री व्यवस्थापन',
          tabBarIcon: ({ color, size }) => (
            <Entypo name="add-to-list" size={28} color={color} />
          ),
        }}
      />

<Tabs.Screen
        name="ResetDatabaseScreen"
        options={{
          href:null,
          title: 'डेटाबेस रीसेट करा',
          tabBarIcon: ({ color, size }) => (
            <Entypo name="add-to-list" size={28} color={color} />
          ),
        }}
      />
       
    </Tabs>
  );
}