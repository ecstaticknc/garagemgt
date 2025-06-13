// CustomDrawer.js
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, Image, Alert, BackHandler } from 'react-native';
import { Feather, Entypo, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useAuth } from './AuthContext';

export default function CustomDrawer(props) {
  const router = useRouter();
  const pathname = usePathname();
  
const { loggedInUser, logout } = useAuth();

  const handleExitApp = () => {
    Alert.alert(
      "अ‍ॅप बंद करा",
      "तुम्हाला अ‍ॅप बंद करायचे आहे का?",
      [
        { text: "रद्द करा", style: "cancel" },
        { text: "होय", 
           onPress: () => {
          logout(); // Clears AuthContext
          router.replace('/'); // Navigates to login screen
        }
         }
      ],
      { cancelable: false }
    );
  };

  
  const isRouteActive = (routePath) => {
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
            source={require('../../assets/logo.png')}
            style={styles.avatar}
          />
          <Text style={styles.username}>समर्थ केटरर्स</Text>
 {loggedInUser && (
            <Text style={styles.userEmail}>
              {loggedInUser.username} ({loggedInUser.role})
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
                color={isRouteActive('home') ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            )}
            onPress={() => router.navigate('/(drawer)/(tabs)/home')}
            labelStyle={[
              styles.label,
              { color: isRouteActive('home') ? ACTIVE_COLOR : INACTIVE_COLOR }
            ]}
            style={[
              styles.menuItem,
              isRouteActive('home') && styles.activeItem
            ]}
          />

          <DrawerItem
            label="ग्राहक नोंदणी"
            icon={({ size }) => (
              <Feather
                name="user-plus"
                size={size}
                color={isRouteActive('customeradd') ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            )}
            onPress={() => router.navigate('/(drawer)/(tabs)/customeradd')}
            labelStyle={[
              styles.label,
              { color: isRouteActive('customeradd') ? ACTIVE_COLOR : INACTIVE_COLOR }
            ]}
            style={[
              styles.menuItem,
              isRouteActive('customeradd') && styles.activeItem
            ]}
          />

          <DrawerItem
            label="ग्राहक यादी"
            icon={({ size }) => (
               <MaterialIcons
                name="event-available"
                size={size}
                color={isRouteActive('customerlist') ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            )}
            onPress={() => router.navigate('/(drawer)/(tabs)/customerlist')}
            labelStyle={[
              styles.label,
              { color: isRouteActive('customerlist') ? ACTIVE_COLOR : INACTIVE_COLOR }
            ]}
            style={[
              styles.menuItem,
              isRouteActive('customerlist') && styles.activeItem
            ]}
          />

          <DrawerItem
            label="पूर्ण कार्यक्रम"
            icon={({ size }) => (
               <MaterialIcons
                name="event-busy"
                size={size}
                color={isRouteActive('CompletedEvents') ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            )}
            onPress={() => router.navigate('/(drawer)/(tabs)/CompletedEvents')}
            labelStyle={[
              styles.label,
              { color: isRouteActive('CompletedEvents') ? ACTIVE_COLOR : INACTIVE_COLOR }
            ]}
            style={[
              styles.menuItem,
              isRouteActive('CompletedEvents') && styles.activeItem
            ]}
          />

           <DrawerItem
            label="बुकिंग व्यवस्थापन"
            icon={({ size }) => (
              <FontAwesome5
                name="calendar-alt"
                size={size}
                color={isRouteActive('BookingView') ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            )}
            onPress={() => router.navigate('/(drawer)/(tabs)/BookingView')}
            labelStyle={[
              styles.label,
              { color: isRouteActive('BookingView') ? ACTIVE_COLOR : INACTIVE_COLOR }
            ]}
            style={[
              styles.menuItem,
              isRouteActive('BookingView') && styles.activeItem
            ]}
          />

          <DrawerItem
            label="सामग्री व्यवस्थापन"
            icon={({ size }) => (
              <Entypo
                name="add-to-list"
                size={size}
                color={isRouteActive('ItemManagement') ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            )}
            onPress={() => router.navigate('/(drawer)/(tabs)/ItemManagement')}
            labelStyle={[
              styles.label,
              { color: isRouteActive('ItemManagement') ? ACTIVE_COLOR : INACTIVE_COLOR }
            ]}
            style={[
              styles.menuItem,
              isRouteActive('ItemManagement') && styles.activeItem
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
                color={isRouteActive('reset-database') ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            )}
            onPress={() => router.navigate('/(drawer)/(tabs)/ResetDatabaseScreen')} // Navigate to the new screen
            labelStyle={[
              styles.label,
              { color: isRouteActive('reset-database') ? ACTIVE_COLOR : INACTIVE_COLOR }
            ]}
            style={[
              styles.menuItem,
              isRouteActive('reset-database') && styles.activeItem
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
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'Mukta-Regular', // Consider adding Marathi font
  },
  userEmail: {
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