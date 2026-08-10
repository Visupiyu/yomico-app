import React, { useEffect, useState } from "react";

import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  signOut,
} from "firebase/auth";

import { auth, db } from "../firebase/firebase";

import { MaterialIcons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";

import {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";


type NavigationProp =
  NativeStackNavigationProp<
    RootStackParamList,
    "EditProfile"
  >;


export default function ProfileScreen() {

  const navigation =
    useNavigation<NavigationProp>();


  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [loading, setLoading] =
    useState(true);


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

      setEmail(
        user.email || ""
      );


      const userRef =
        doc(
          db,
          "users",
          user.uid
        );


      const snapshot =
        await getDoc(userRef);


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

    } finally {

      setLoading(false);

    }

  }


  async function handleLogout() {

    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Logout",
          style: "destructive",

          onPress:
            async () => {

              try {

                await signOut(
                  auth
                );

                navigation.navigate("MainTabs", {
  screen: "LoginTab",
});

              } catch (error) {

                console.log(
                  "Logout error:",
                  error
                );

                Alert.alert(
                  "Error",
                  "Unable to logout."
                );

              }

            },
        },
      ]
    );

  }


  if (loading) {

    return (

      <SafeAreaView
        style={styles.container}
      >

        <View
          style={styles.loadingContainer}
        >

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

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* HEADER */}

        <View
          style={styles.header}
        >

          <Text
            style={styles.title}
          >
            My Account
          </Text>

        </View>


        {/* PROFILE */}

        <View
          style={styles.profileCard}
        >

          <View
            style={styles.avatar}
          >

            <MaterialIcons
              name="person"
              size={30}
              color="#FFFFFF"
            />

          </View>
<TouchableOpacity
  style={styles.editButton}
  activeOpacity={0.8}
  onPress={() =>
    navigation.navigate(
      "EditProfile"
    )
  }
>
  <MaterialIcons
    name="edit"
    size={18}
    color="#16A34A"
  />

  <Text
    style={styles.editButtonText}
  >
    Edit
  </Text>
</TouchableOpacity>

          <View
            style={styles.profileInfo}
          >

            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {name ||
                "YOMICO Customer"}
            </Text>


            <Text
              style={styles.email}
              numberOfLines={1}
            >
              {email}
            </Text>

          </View>

        </View>


        {/* ACCOUNT INFORMATION */}

        <View
          style={styles.section}
        >

          <Text
            style={styles.sectionTitle}
          >
            Account Information
          </Text>


          <View
            style={styles.infoRow}
          >

            <MaterialIcons
              name="person-outline"
              size={20}
              color="#16A34A"
            />

            <View
              style={styles.infoContent}
            >

              <Text
                style={styles.infoLabel}
              >
                Name
              </Text>

              <Text
                style={styles.infoValue}
              >
                {name ||
                  "Not available"}
              </Text>

            </View>

          </View>


          <View
            style={styles.infoRow}
          >

            <MaterialIcons
              name="email"
              size={20}
              color="#16A34A"
            />

            <View
              style={styles.infoContent}
            >

              <Text
                style={styles.infoLabel}
              >
                Email
              </Text>

              <Text
                style={styles.infoValue}
                numberOfLines={1}
              >
                {email}
              </Text>

            </View>

          </View>


          <View
            style={styles.infoRow}
          >

            <MaterialIcons
              name="phone"
              size={20}
              color="#16A34A"
            />

            <View
              style={styles.infoContent}
            >

              <Text
                style={styles.infoLabel}
              >
                Mobile
              </Text>

              <Text
                style={styles.infoValue}
              >
                {mobile ||
                  "Not available"}
              </Text>

            </View>

          </View>

        </View>


        {/* ACCOUNT MENU */}

        <View
          style={styles.menuSection}
        >

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate(
                "Orders"
              )
            }
          >

            <View
              style={styles.menuLeft}
            >

              <MaterialIcons
                name="receipt-long"
                size={21}
                color="#16A34A"
              />

              <Text
                style={styles.menuText}
              >
                My Orders
              </Text>

            </View>


            <MaterialIcons
              name="chevron-right"
              size={22}
              color="#999999"
            />

          </TouchableOpacity>
<TouchableOpacity
  style={styles.menuRow}
  activeOpacity={0.7}
  onPress={() =>
    navigation.navigate(
      "RecentlyViewed"
    )
  }
>

  <View
    style={styles.menuLeft}
  >

    <MaterialIcons
      name="history"
      size={21}
      color="#16A34A"
    />

    <Text
      style={styles.menuText}
    >
      Recently Viewed
    </Text>

  </View>


  <MaterialIcons
    name="chevron-right"
    size={22}
    color="#999999"
  />

</TouchableOpacity>
<TouchableOpacity
  style={styles.menuRow}
  activeOpacity={0.7}
  onPress={() =>
    navigation.navigate(
      "Support"
    )
  }
>

  <View
    style={styles.menuLeft}
  >

    <MaterialIcons
      name="support-agent"
      size={21}
      color="#16A34A"
    />

    <Text
      style={styles.menuText}
    >
      Help & Support
    </Text>

  </View>


  <MaterialIcons
    name="chevron-right"
    size={22}
    color="#999999"
  />

</TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() =>
    navigation.navigate("MainTabs", { screen: "WishlistTab" })
  }
          >

            <View
              style={styles.menuLeft}
            >

              <MaterialIcons
                name="favorite-border"
                size={21}
                color="#E53935"
              />

              <Text
                style={styles.menuText}
              >
                Wishlist
              </Text>

            </View>


            <MaterialIcons
              name="chevron-right"
              size={22}
              color="#999999"
            />

          </TouchableOpacity>


          <TouchableOpacity
  style={styles.menuRow}
  activeOpacity={0.7}
  onPress={() =>
    navigation.navigate("Address")
  }
>

            <View
              style={styles.menuLeft}
            >

              <MaterialIcons
                name="location-on"
                size={21}
                color="#16A34A"
              />

              <Text
                style={styles.menuText}
              >
                Delivery Address
              </Text>

            </View>


            <MaterialIcons
              name="chevron-right"
              size={22}
              color="#999999"
            />

          </TouchableOpacity>

        </View>


        {/* LOGOUT */}

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={
            handleLogout
          }
        >

          <MaterialIcons
            name="logout"
            size={19}
            color="#E53935"
          />

          <Text
            style={styles.logoutText}
          >
            Logout
          </Text>

        </TouchableOpacity>


        <View
          style={styles.bottomSpace}
        />

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


    profileCard: {
      backgroundColor: "#FFFFFF",
      marginTop: 7,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
    },


    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: "#16A34A",
      alignItems: "center",
      justifyContent: "center",
    },


    profileInfo: {
      flex: 1,
      marginLeft: 12,
    },


    name: {
      fontSize: 16,
      fontWeight: "800",
      color: "#222222",
    },


    email: {
      fontSize: 11,
      color: "#777777",
      marginTop: 3,
    },


    section: {
      backgroundColor: "#FFFFFF",
      marginTop: 7,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },


    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: "#222222",
      marginBottom: 5,
    },


    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: "#F0F0F0",
    },


    infoContent: {
      flex: 1,
      marginLeft: 11,
    },


    infoLabel: {
      fontSize: 10,
      color: "#888888",
    },


    infoValue: {
      fontSize: 13,
      color: "#333333",
      fontWeight: "600",
      marginTop: 2,
    },


    menuSection: {
      backgroundColor: "#FFFFFF",
      marginTop: 7,
      paddingHorizontal: 14,
    },


    menuRow: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: "#F0F0F0",
    },


    menuLeft: {
      flexDirection: "row",
      alignItems: "center",
    },


    menuText: {
      fontSize: 13,
      color: "#333333",
      fontWeight: "600",
      marginLeft: 11,
    },
editButton: {
  height: 36,
  paddingHorizontal: 10,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#16A34A",
  backgroundColor: "#FFFFFF",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
},

editButtonText: {
  marginLeft: 5,
  fontSize: 12,
  fontWeight: "800",
  color: "#16A34A",
},

    logoutButton: {
      marginHorizontal: 14,
      marginTop: 12,
      height: 46,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: "#E53935",
      backgroundColor: "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },


    logoutText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#E53935",
      marginLeft: 7,
    },


    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },


    loadingText: {
      fontSize: 12,
      color: "#777777",
    },


    bottomSpace: {
      height: 25,
    },

  });