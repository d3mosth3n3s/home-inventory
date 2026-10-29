import { createDrawerNavigator } from "@react-navigation/drawer";
import useIsWide from "../hooks/useIsWide";
import Sidebar from "../components/Sidebar";
import DashboardScreen from "../screens/DashboardScreen";
import InventoryScreen from "../screens/InventoryScreen";
import AddItemScreen from "../screens/AddItemScreen";
// ...import your other existing screens

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  const isWide = useIsWide();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={{
        drawerType: isWide ? "permanent" : "front",
        headerShown: !isWide, // hamburger header only on small screens
        drawerStyle: { width: isWide ? 260 : 280 },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Inventory" component={InventoryScreen} />
      <Drawer.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{ title: "Add Item" }}
      />
    </Drawer.Navigator>
  );
}
