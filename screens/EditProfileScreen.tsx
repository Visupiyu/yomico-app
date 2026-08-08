import React, {
  useEffect,
  useState,
} from "react";

import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";


export default function EditProfileScreen() {

  const [name, setName] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);


  useEffect(() => {

    loadProfile();

  }, []);


  async function loadProfile() {

    const user =
      auth.currentUser;

    if (!user) {

      setLoading(false);

      return;

    }


    try {

      const userRef =
        doc(
          db,
          "users",
          user.uid
        );

      const snapshot =
        await getDoc(
          userRef
        );


      if (
        snapshot.exists()
      ) {

        const data =
          snapshot.data();

        setName(
          data.name || ""
        );

        setMobile(
          data.mobile || ""
        );

      }

    } catch (error) {

      console.log(
        "Profile loading error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to load profile."
      );

    } finally {

      setLoading(false);

    }

  }


  async function saveProfile() {

    const user =
      auth.currentUser;

    if (!user) {

      Alert.alert(
        "Login Required",
        "Please login again."
      );

      return;

    }


    if (!name.trim()) {

      Alert.alert(
        "Name Required",
        "Please enter your name."
      );

      return;

    }


    try {

      setSaving(true);


      await updateDoc(
        doc(
          db,
          "users",
          user.uid
        ),
        {
          name:
            name.trim(),

          mobile:
            mobile.trim(),
        }
      );


      Alert.alert(
        "Profile Updated",
        "Your profile has been updated successfully."
      );

    } catch (error) {

      console.log(
        "Profile update error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to update your profile."
      );

    } finally {

      setSaving(false);

    }

  }


  if (loading) {

    return (

      <SafeAreaView
        style={styles.container}
      >

        <View
          style={styles.loading}
        >

          <ActivityIndicator
            size="small"
            color="#16A34A"
          />

          <Text
            style={styles.loadingText}
          >
            Loading profile...
          </Text>

        </View>

      </SafeAreaView>

    );

  }


  return (

    <SafeAreaView
      style={styles.container}
    >

      <View
        style={styles.header}
      >

        <Text
          style={styles.title}
        >
          Edit Profile
        </Text>

        <Text
          style={styles.subtitle}
        >
          Update your account information
        </Text>

      </View>


      <View
        style={styles.form}
      >

        <Text
          style={styles.label}
        >
          Name
        </Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={
            setName
          }
          placeholder="Enter your name"
          placeholderTextColor="#999999"
        />


        <Text
          style={styles.label}
        >
          Email
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.disabledInput,
          ]}
          value={
            auth.currentUser?.email ||
            ""
          }
          editable={false}
        />


        <Text
          style={styles.label}
        >
          Mobile
        </Text>

        <TextInput
          style={styles.input}
          value={mobile}
          onChangeText={
            setMobile
          }
          placeholder="Enter mobile number"
          placeholderTextColor="#999999"
          keyboardType="phone-pad"
        />


        <TouchableOpacity
          style={styles.saveButton}
          onPress={
            saveProfile
          }
          disabled={
            saving
          }
          activeOpacity={0.8}
        >

          {saving ? (

            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />

          ) : (

            <Text
              style={
                styles.saveText
              }
            >
              Save Changes
            </Text>

          )}

        </TouchableOpacity>

      </View>

    </SafeAreaView>

  );

}


const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: "#F5F5F5",
    },

    header: {
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 15,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: "#EEEEEE",
    },

    title: {
      fontSize: 19,
      fontWeight: "800",
      color: "#222222",
    },

    subtitle: {
      marginTop: 3,
      fontSize: 11,
      color: "#777777",
    },

    form: {
      backgroundColor: "#FFFFFF",
      marginTop: 8,
      padding: 15,
    },

    label: {
      fontSize: 12,
      fontWeight: "700",
      color: "#555555",
      marginBottom: 6,
    },

    input: {
      height: 46,
      borderWidth: 1,
      borderColor: "#DDDDDD",
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 13,
      color: "#333333",
      marginBottom: 15,
    },

    disabledInput: {
      backgroundColor: "#F5F5F5",
      color: "#888888",
    },

    saveButton: {
      height: 46,
      borderRadius: 8,
      backgroundColor: "#16A34A",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 5,
    },

    saveText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
    },

    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      marginTop: 8,
      fontSize: 12,
      color: "#777777",
    },

  });