import React from "react";

import {
  NavigationContainer,
} from "@react-navigation/native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import {
  MaterialIcons,
} from "@expo/vector-icons";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";


import {
  RootStackParamList,
  TabParamList,
} from "./types";

export type {
  RootStackParamList,
  TabParamList,
};


/* =========================
   MAIN SCREENS
========================= */

import HomeScreen
  from "../screens/HomeScreen";

import LoginScreen
  from "../screens/LoginScreen";

import CartScreen
  from "../screens/CartScreen";

import ProfileScreen
  from "../screens/ProfileScreen";

import WishlistScreen
  from "../screens/WishlistScreen";


/* =========================
   OTHER SCREENS
========================= */

import RegisterScreen
  from "../screens/RegisterScreen";

import ProductDetailsScreen
  from "../screens/ProductDetailsScreen";

import CheckoutScreen
  from "../screens/CheckoutScreen";

import OrdersScreen
  from "../screens/OrdersScreen";

import OrderDetailsScreen
  from "../screens/OrderDetailsScreen";

import EditProfileScreen
  from "../screens/EditProfileScreen";

import AddressScreen
  from "../screens/AddressScreen";

import EditAddressScreen
  from "../screens/EditAddressScreen";

import SearchScreen
  from "../screens/SearchScreen";

import ProductQuestionsScreen
  from "../screens/ProductQuestionsScreen";

import ChatScreen
  from "../screens/ChatScreen";

import NotificationsScreen
  from "../screens/NotificationsScreen";

import RecentlyViewedScreen
  from "../screens/RecentlyViewedScreen";

import SupportScreen
  from "../screens/SupportScreen";


/* =========================
   NAVIGATORS
========================= */

const Stack =
  createNativeStackNavigator<
    RootStackParamList
  >();

const Tab =
  createBottomTabNavigator<
    TabParamList
  >();


/* =========================
   BOTTOM TABS
========================= */

function BottomTabs() {

  const insets = useSafeAreaInsets();

  return (

    <Tab.Navigator

      initialRouteName="HomeTab"

      screenOptions={{

        headerShown: false,

        tabBarActiveTintColor:
          "#16A34A",

        tabBarInactiveTintColor:
          "#64748B",

        tabBarStyle: {

          height: 62 + insets.bottom,

          paddingBottom: 7 + insets.bottom,

          paddingTop: 5,

        },

        tabBarLabelStyle: {

          fontSize: 10,

          fontWeight: "600",

        },

        tabBarIconStyle: {

          marginTop: 2,

        },

      }}

    >

      {/* =========================
          HOME
      ========================== */}

      <Tab.Screen

        name="HomeTab"

        component={HomeScreen}

        options={{

          tabBarLabel: "Home",

          tabBarIcon: ({
            color,
            size,
          }) => (

            <MaterialIcons
              name="home"
              color={color}
              size={size}
            />

          ),

        }}

      />


      {/* =========================
          LOGIN
      ========================== */}

      <Tab.Screen

        name="LoginTab"

        component={LoginScreen}

        options={{

          tabBarLabel: "Login",

          tabBarIcon: ({
            color,
            size,
          }) => (

            <MaterialIcons
              name="login"
              color={color}
              size={size}
            />

          ),

        }}

      />


      {/* =========================
          CART
      ========================== */}

      <Tab.Screen

        name="CartTab"

        component={CartScreen}

        options={{

          tabBarLabel: "Cart",

          tabBarIcon: ({
            color,
            size,
          }) => (

            <MaterialIcons
              name="shopping-cart"
              color={color}
              size={size}
            />

          ),

        }}

      />


      {/* =========================
          PROFILE
      ========================== */}

      <Tab.Screen

        name="ProfileTab"

        component={ProfileScreen}

        options={{

          tabBarLabel: "Profile",

          tabBarIcon: ({
            color,
            size,
          }) => (

            <MaterialIcons
              name="person"
              color={color}
              size={size}
            />

          ),

        }}

      />


      {/* =========================
          WISHLIST (hidden tab, used
          via navigation.navigate only)
      ========================== */}

      <Tab.Screen

        name="WishlistTab"

        component={WishlistScreen}

        options={{

          tabBarButton: () => null,

          tabBarItemStyle: {
            display: "none",
          },

        }}

      />

    </Tab.Navigator>

  );

}


/* =========================
   APP NAVIGATOR
========================= */

export default function AppNavigator() {

  return (

    <NavigationContainer>

     <Stack.Navigator
  initialRouteName="MainTabs"
  screenOptions={{
    headerShown: false,
  }}
>
  <Stack.Screen
    name="MainTabs"
    component={BottomTabs}
  />

  <Stack.Screen
    name="Register"
    component={RegisterScreen}
  />

  <Stack.Screen
    name="ProductDetails"
    component={ProductDetailsScreen}
  />

  <Stack.Screen
    name="Checkout"
    component={CheckoutScreen}
  />

  <Stack.Screen
    name="Orders"
    component={OrdersScreen}
  />

  <Stack.Screen
    name="OrderDetails"
    component={OrderDetailsScreen}
  />

  <Stack.Screen
    name="EditProfile"
    component={EditProfileScreen}
  />

  <Stack.Screen
    name="Wishlist"
    component={WishlistScreen}
  />

  <Stack.Screen
    name="Address"
    component={AddressScreen}
  />

  <Stack.Screen
    name="EditAddress"
    component={EditAddressScreen}
  />

  <Stack.Screen
    name="Search"
    component={SearchScreen}
  />

  <Stack.Screen
    name="ProductQuestions"
    component={ProductQuestionsScreen}
  />

  <Stack.Screen
    name="Chat"
    component={ChatScreen}
  />

  <Stack.Screen
    name="Notifications"
    component={NotificationsScreen}
  />

  <Stack.Screen
    name="RecentlyViewed"
    component={RecentlyViewedScreen}
  />

  <Stack.Screen
    name="Support"
    component={SupportScreen}
  />
</Stack.Navigator>


    </NavigationContainer>

  );

}