import React from "react";

import {
  NavigationContainer,
} from "@react-navigation/native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import ProductDetailsScreen from "../screens/ProductDetailsScreen";
import CartScreen from "../screens/CartScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import OrdersScreen from "../screens/OrdersScreen";
import OrderDetailsScreen from "../screens/OrderDetailsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import WishlistScreen from "../screens/WishlistScreen";
import AddressScreen from "../screens/AddressScreen";
import SearchScreen from "../screens/SearchScreen";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ProductDetails: {product: any;};
  Cart: undefined;
  Checkout: undefined;
  Orders: undefined;
OrderDetails: {order: any;};
Profile: undefined;
Wishlist: undefined;
Address: undefined;
Search:| {category?: string; } | undefined;
};


const Stack =
  createNativeStackNavigator<
    RootStackParamList
  >();


export default function AppNavigator() {

  return (

    <NavigationContainer>

      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >

        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />


        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />


        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />


        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />
<Stack.Screen
  name="Search"
  component={SearchScreen}
/>

        <Stack.Screen
          name="ProductDetails"
          component={ProductDetailsScreen}
        />


        <Stack.Screen
          name="Cart"
          component={CartScreen}
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
  name="Profile"
  component={ProfileScreen}
/>
<Stack.Screen
  name="Wishlist"
  component={WishlistScreen}
/>
<Stack.Screen
  name="Address"
  component={AddressScreen}
/>
      </Stack.Navigator>

    </NavigationContainer>

  );

}