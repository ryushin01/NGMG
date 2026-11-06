import { Drawer } from 'expo-router/drawer';
import { AppDrawer } from '@/widgets/app-drawer';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        swipeEnabled: false,
        drawerType: 'front',
        drawerStyle: { width: '80%' },
      }}
      drawerContent={({ navigation }) => <AppDrawer onNavigate={() => navigation.closeDrawer()} />}
    >
      <Drawer.Screen name="index" />
    </Drawer>
  );
}
