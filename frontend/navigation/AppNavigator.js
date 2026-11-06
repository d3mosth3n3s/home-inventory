import { createDrawerNavigator } from "@react-navigation/drawer";
import useIsWide from "../hooks/useIsWide";
import Sidebar from "../components/Sidebar";
import DashboardScreen from "../screens/DashboardScreen";
import InventoryScreen from "../screens/InventoryScreen";
import RoomsScreen from "../screens/RoomsScreen";
import { useTheme } from "../context/ThemeContext";
import AddItemScreen from "../screens/AddItemScreen";

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  const isWide = useIsWide();
  const { colors } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={{
        drawerType: isWide ? "permanent" : "front",
        headerShown: !isWide, // hamburger helper only on small screens
        drawerStyle: {
          width: isWide ? 260 : 280,
          backgroundColor: colors.surface,
        },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Inventory" component={InventoryScreen} />
      <Drawer.Screen name="Rooms" component={RoomsScreen} />
      <Drawer.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{ title: "Add Item" }}
      />
    </Drawer.Navigator>
  );
}
