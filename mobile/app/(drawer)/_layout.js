import { Drawer } from 'expo-router/drawer';
import CustomDrawer from '../(drawer)/CustomDrawer'; // optional

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: '70%',
        },
      }}
    />
  );
}
