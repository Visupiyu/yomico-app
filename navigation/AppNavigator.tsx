import React from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { MaterialIcons } from "@expo/vector-icons";

import { RootStackParamList, TabParamList } from "./types";
export type { RootStackParamList, TabParamList };

/* ONLY the four tab screens are imported here.
   Every other screen import is commented out. If the tabs work now,
   one of the commented-out screens was breaking the whole module —
   uncomment them a few at a time to find which. */

import HomeScreen from "../screens/HomeScreen";
import CartScreen from "../screens/CartScreen";
import ProfileScreen from "../screens/ProfileScreen";
import WishlistScreen from "../screens/WishlistScreen";

// import SplashScreen from "../screens/SplashScreen";
// import LoginScreen from "../screens/LoginScreen";
// import RegisterScreen from "../screens/RegisterScreen";
// import ProductDetailsScreen from "../screens/ProductDetailsScreen";
// import CheckoutScreen from "../screens/CheckoutScreen";
// import OrdersScreen from "../screens/OrdersScreen";
// import OrderDetailsScreen from "../screens/OrderDetailsScreen";
// import AddressScreen from "../screens/AddressScreen";
// import SearchScreen from "../screens/SearchScreen";
// import ProductQuestionsScreen from "../screens/ProductQuestionsScreen";
// import ChatScreen from "../screens/ChatScreen";
// import NotificationsScreen from "../screens/NotificationsScreen";
// import RecentlyViewedScreen from "../screens/RecentlyViewedScreen";
// import EditProfileScreen from "../screens/EditProfileScreen";
// import EditAddressScreen from "../screens/EditAddressScreen";
// import SupportScreen from "../screens/SupportScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

/* Logs at module load. Any `undefined` here identifies a broken screen. */
console.log("=== SCREEN RESOLUTION ===");
console.log("Home:", typeof HomeScreen);
console.log("Cart:", typeof CartScreen);
console.log("Profile:", typeof ProfileScreen);
console.log("Wishlist:", typeof WishlistScreen);

function BottomTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#16A34A",
        tabBarInactiveTintColor: "#64748B",
        tabBarStyle: {
          height: 62,
          paddingBottom: 7,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: "Cart",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="shopping-cart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="WishlistTab"
        component={WishlistScreen}
        options={{
          tabBarLabel: "Wishlist",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="favorite-border" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="MainTabs" component={BottomTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
