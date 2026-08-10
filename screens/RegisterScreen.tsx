import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { RootStackParamList } from "../navigation/AppNavigator";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleRegister() {

  if (
    !name ||
    !email ||
    !mobile ||
    !password ||
    !confirmPassword
  ) {
    Alert.alert("Error", "Please fill all fields.");
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Error", "Passwords do not match.");
    return;
  }

  try {

  console.log("Starting Firebase Registration...");

  const userCredential =
    await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

  console.log("Registration Success");
  console.log(userCredential.user);

  await setDoc(
    doc(db, "users", userCredential.user.uid),
    {
      uid: userCredential.user.uid,
      name,
      email,
      mobile,
      role: "customer",
      createdAt: serverTimestamp(),
    }
  );

  Alert.alert(
    "Success",
    "Account created successfully!"
  );

 navigation.navigate("MainTabs", {
  screen: "LoginTab",
});

} catch (error: any) {

  console.log("Firebase Error:", error);

  Alert.alert(
    "Registration Failed",
    error.code + "\n\n" + error.message
  );

}

  }
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.logo}>YOMICO</Text>

      <Text style={styles.subtitle}>
        Create Your Account
      </Text>

      <TextInput
        placeholder="Full Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Email"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Mobile Number"
        style={styles.input}
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
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

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Confirm Password"
          secureTextEntry={!showConfirmPassword}
          style={styles.passwordInput}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          onPress={() =>
            setShowConfirmPassword(!showConfirmPassword)
          }
        >
          <MaterialIcons
            name={
              showConfirmPassword
                ? "visibility"
                : "visibility-off"
            }
            size={24}
            color="#777"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>
          Create Account
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.loginLink}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    marginBottom: 30,
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
    marginBottom: 15,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 15,
  },

  button: {
    backgroundColor: "#16A34A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  loginLink: {
    marginTop: 25,
    textAlign: "center",
    color: "#16A34A",
    fontWeight: "600",
  },
});
