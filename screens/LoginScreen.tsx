import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { MaterialIcons } from "@expo/vector-icons";

import { auth } from "../firebase/firebase";
import { RootStackParamList } from "../navigation/AppNavigator";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Missing Information", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

     navigation.replace("MainTabs", {
  screen: "HomeTab",
});
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert(
        "Email Required",
        "Enter your email above first, then tap Forgot Password."
      );
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());

      Alert.alert(
        "Reset Email Sent",
        "Check your inbox for a link to reset your password."
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  }

  return (
    <View style={styles.container}>

      <Text style={styles.logo}>
        YOMICO
      </Text>

      <Text style={styles.subtitle}>
        Welcome Back
      </Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.passwordContainer}>

        <TextInput
          placeholder="Password"
          style={styles.passwordInput}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          onPress={() =>
            setShowPassword(!showPassword)
          }
        >
          <MaterialIcons
            name={
              showPassword
                ? "visibility"
                : "visibility-off"
            }
            size={24}
            color="#777"
          />
        </TouchableOpacity>

      </View>

      <TouchableOpacity
        onPress={handleForgotPassword}
      >
        <Text style={styles.forgotPassword}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            Login
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate("Register")
        }
      >
        <Text style={styles.register}>
          Don't have an account? Register
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#fff",
  },

  logo: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#16A34A",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    marginBottom: 35,
    fontSize: 18,
    color: "#666",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },

  passwordContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 25,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 15,
  },

  forgotPassword: {
    textAlign: "right",
    color: "#16A34A",
    fontWeight: "600",
    fontSize: 13,
    marginTop: -15,
    marginBottom: 20,
  },

  button: {
    backgroundColor: "#16A34A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  register: {
    marginTop: 25,
    textAlign: "center",
    color: "#16A34A",
    fontWeight: "600",
  },

});