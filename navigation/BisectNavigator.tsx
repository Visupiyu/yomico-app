import React from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// The ONE real screen under test. Swap this line to test another:
//   ../screens/CartScreen  /  ProfileScreen  /  WishlistScreen
import RealScreen from "../screens/HomeScreen";

const Tab = createBottomTabNavigator();

function Stub({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color,
      }}
    >
      <Text style={{ fontSize: 32, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

const StubA = () => <Stub label="STUB A" color="#DCFCE7" />;
const StubB = () => <Stub label="STUB B" color="#DBEAFE" />;

export default function BisectNavigator() {
  // Logs BEFORE any render. If RealScreen is undefined, the circular
  // import / module-load failure is confirmed.
  console.log("=== RealScreen resolved as:", typeof RealScreen, RealScreen);

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="StubA" component={StubA} />
        <Tab.Screen name="Real" component={RealScreen} />
        <Tab.Screen name="StubB" component={StubB} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
