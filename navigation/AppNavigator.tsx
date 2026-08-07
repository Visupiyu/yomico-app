import React from "react";

import { NavigationContainer } from "@react-navigation/native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import ProductDetailsScreen from "../screens/ProductDetailsScreen";
import CartScreen from "../screens/CartScreen";
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ProductDetails: { product: any };
  Cart: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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
  name="ProductDetails"
  component={ProductDetailsScreen}
/>    
<Stack.Screen
  name="Cart"
  component={CartScreen}
/>  

      </Stack.Navigator>

    </NavigationContainer>

  );

}