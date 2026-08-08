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
  ScrollView,
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

import {
  RouteProp,
  useRoute,
} from "@react-navigation/native";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";


type EditAddressRouteProp =
  RouteProp<
    RootStackParamList,
    "EditAddress"
  >;


export default function EditAddressScreen() {

  const route =
    useRoute<EditAddressRouteProp>();

  const {
    addressId,
  } = route.params;


  const [name, setName] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [city, setCity] =
    useState("");

  const [state, setState] =
    useState("");

  const [pincode, setPincode] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);


  useEffect(() => {

    loadAddress();

  }, []);


  async function loadAddress() {

    try {

      const user =
        auth.currentUser;

      if (!user) {

        setLoading(false);

        return;

      }


      const addressRef =
        doc(
          db,
          "addresses",
          addressId
        );

      const snapshot =
        await getDoc(
          addressRef
        );


      if (!snapshot.exists()) {

        Alert.alert(
          "Address Not Found",
          "This address no longer exists."
        );

        setLoading(false);

        return;

      }


      const data =
        snapshot.data();


      if (
        data.userId !==
        user.uid
      ) {

        Alert.alert(
          "Access Denied",
          "This address does not belong to you."
        );

        setLoading(false);

        return;

      }


      setName(
        data.name || ""
      );

      setMobile(
        data.mobile || ""
      );

      setAddress(
        data.address || ""
      );

      setCity(
        data.city || ""
      );

      setState(
        data.state || ""
      );

      setPincode(
        data.pincode || ""
      );

    } catch (error) {

      console.log(
        "Address loading error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to load address."
      );

    } finally {

      setLoading(false);

    }

  }


  async function saveAddress() {

    const user =
      auth.currentUser;

    if (!user) {

      Alert.alert(
        "Login Required",
        "Please login first."
      );

      return;

    }


    if (
      !name.trim() ||
      !mobile.trim() ||
      !address.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pincode.trim()
    ) {

      Alert.alert(
        "Missing Details",
        "Please fill all address fields."
      );

      return;

    }


    if (
      mobile.trim().length !== 10
    ) {

      Alert.alert(
        "Invalid Mobile",
        "Please enter a valid 10-digit mobile number."
      );

      return;

    }


    if (
      pincode.trim().length !== 6
    ) {

      Alert.alert(
        "Invalid Pincode",
        "Please enter a valid 6-digit pincode."
      );

      return;

    }


    try {

      setSaving(true);


      const addressRef =
        doc(
          db,
          "addresses",
          addressId
        );


      const snapshot =
        await getDoc(
          addressRef
        );


      if (!snapshot.exists()) {

        Alert.alert(
          "Address Not Found",
          "This address no longer exists."
        );

        return;

      }


      const existing =
        snapshot.data();


      if (
        existing.userId !==
        user.uid
      ) {

        Alert.alert(
          "Access Denied",
          "You cannot edit this address."
        );

        return;

      }


      await updateDoc(
        addressRef,
        {
          name:
            name.trim(),

          mobile:
            mobile.trim(),

          address:
            address.trim(),

          city:
            city.trim(),

          state:
            state.trim(),

          pincode:
            pincode.trim(),
        }
      );


      Alert.alert(
        "Address Updated",
        "Your address has been updated successfully."
      );

    } catch (error) {

      console.log(
        "Address update error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to update address."
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
            Loading address...
          </Text>

        </View>

      </SafeAreaView>

    );

  }


  return (

    <SafeAreaView
      style={styles.container}
    >

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
      >

        <View
          style={styles.header}
        >

          <Text
            style={styles.title}
          >
            Edit Address
          </Text>

          <Text
            style={styles.subtitle}
          >
            Update your delivery address
          </Text>

        </View>


        <View
          style={styles.form}
        >

          <Text
            style={styles.label}
          >
            Full Name
          </Text>

          <TextInput
            value={name}
            onChangeText={
              setName
            }
            placeholder="Enter full name"
            placeholderTextColor="#999999"
            style={styles.input}
          />


          <Text
            style={styles.label}
          >
            Mobile Number
          </Text>

          <TextInput
            value={mobile}
            onChangeText={
              setMobile
            }
            placeholder="10-digit mobile number"
            placeholderTextColor="#999999"
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />


          <Text
            style={styles.label}
          >
            Address
          </Text>

          <TextInput
            value={address}
            onChangeText={
              setAddress
            }
            placeholder="House / Flat / Street"
            placeholderTextColor="#999999"
            multiline
            style={[
              styles.input,
              styles.addressInput,
            ]}
          />


          <Text
            style={styles.label}
          >
            City
          </Text>

          <TextInput
            value={city}
            onChangeText={
              setCity
            }
            placeholder="Enter city"
            placeholderTextColor="#999999"
            style={styles.input}
          />


          <Text
            style={styles.label}
          >
            State
          </Text>

          <TextInput
            value={state}
            onChangeText={
              setState
            }
            placeholder="Enter state"
            placeholderTextColor="#999999"
            style={styles.input}
          />


          <Text
            style={styles.label}
          >
            Pincode
          </Text>

          <TextInput
            value={pincode}
            onChangeText={
              setPincode
            }
            placeholder="6-digit pincode"
            placeholderTextColor="#999999"
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
          />


          <TouchableOpacity
            style={[
              styles.saveButton,
              saving &&
                styles.disabledButton,
            ]}
            activeOpacity={0.8}
            disabled={saving}
            onPress={
              saveAddress
            }
          >

            {saving ? (

              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

            ) : (

              <Text
                style={
                  styles.saveButtonText
                }
              >
                Save Changes
              </Text>

            )}

          </TouchableOpacity>

        </View>

      </ScrollView>

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
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: "#EEEEEE",
    },

    title: {
      fontSize: 20,
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
      marginTop: 7,
      padding: 14,
    },

    label: {
      fontSize: 12,
      fontWeight: "700",
      color: "#444444",
      marginBottom: 5,
    },

    input: {
      height: 43,
      borderWidth: 1,
      borderColor: "#DDDDDD",
      borderRadius: 8,
      paddingHorizontal: 10,
      fontSize: 13,
      color: "#222222",
      backgroundColor: "#FFFFFF",
      marginBottom: 11,
    },

    addressInput: {
      height: 65,
      paddingTop: 10,
      textAlignVertical: "top",
    },

    saveButton: {
      height: 45,
      backgroundColor: "#16A34A",
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },

    disabledButton: {
      opacity: 0.6,
    },

    saveButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
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