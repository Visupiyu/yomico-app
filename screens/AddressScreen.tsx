import React, {
  useCallback,
  useState,
} from "react";

import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc, updateDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

import {
  MaterialIcons,
} from "@expo/vector-icons";

import {
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";

import {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";


type NavigationProp =
  NativeStackNavigationProp<
    RootStackParamList,
    "Address"
  >;


type Address = {
  id: string;
  userId?: string;
  name?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
};


export default function AddressScreen() {

  const navigation =
    useNavigation<NavigationProp>();


  const [addresses, setAddresses] =
    useState<Address[]>([]);

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


  // This screen stays mounted in the stack while EditAddress is
  // pushed on top of it, so a mount-only load would keep showing the
  // pre-edit address after saving changes there and going back.
  useFocusEffect(
    useCallback(() => {

      loadAddresses();

    }, [])
  );


  async function loadAddresses() {

    const user =
      auth.currentUser;


    if (!user) {

      setLoading(false);

      return;

    }


    try {

      const addressQuery =
        query(
          collection(
            db,
            "addresses"
          ),
          where(
            "userId",
            "==",
            user.uid
          )
        );


      const snapshot =
        await getDocs(
          addressQuery
        );


      const data =
        snapshot.docs.map(
          (item) => ({

            id:
              item.id,

            ...item.data(),

          })
        ) as Address[];


      setAddresses(
        data
      );

    } catch (error) {

      console.log(
        "Address loading error:",
        error
      );

    } finally {

      setLoading(false);

    }

  }


  async function saveAddress() {

    // The Save button's disabled state only lands after this render
    // commits, so a fast double-tap can call this handler twice
    // before that happens — without this guard that adds the same
    // address as two separate documents.
    if (saving) {
      return;
    }

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


      const addressData = {

        userId:
          user.uid,

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
isDefault: addresses.length === 0,
      };


      const document =
        await addDoc(
          collection(
            db,
            "addresses"
          ),
          addressData
        );


      setAddresses(
        (current) => [

          ...current,

          {
            id:
              document.id,

            ...addressData,
          },

        ]
      );


      setName("");
      setMobile("");
      setAddress("");
      setCity("");
      setState("");
      setPincode("");


      Alert.alert(
        "Success",
        "Address saved successfully."
      );

    } catch (error) {

      console.log(
        "Address save error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to save address."
      );

    } finally {

      setSaving(false);

    }

  }


  async function removeAddress(
    addressId: string
  ) {

    try {

      const removedAddress =
        addresses.find(
          (item) => item.id === addressId
        );

      await deleteDoc(
        doc(
          db,
          "addresses",
          addressId
        )
      );


      const remaining =
        addresses.filter(
          (item) =>
            item.id !== addressId
        );


      // Deleting the default address left none flagged as default —
      // Checkout's auto-fill picks the first address after sorting by
      // isDefault, so with no default set it would silently pre-fill
      // whatever address Firestore happens to return first instead of
      // a deliberately chosen one. Promote the next remaining address
      // so there's always a default when one exists.
      if (
        removedAddress?.isDefault &&
        remaining.length > 0
      ) {

        try {

          await updateDoc(
            doc(
              db,
              "addresses",
              remaining[0].id
            ),
            {
              isDefault: true,
            }
          );

          remaining[0] = {
            ...remaining[0],
            isDefault: true,
          };

        } catch (promoteError) {

          console.log(
            "Default address promotion error:",
            promoteError
          );

        }

      }


      setAddresses(
        remaining
      );


      Alert.alert(
        "Removed",
        "Address removed successfully."
      );

    } catch (error) {

      console.log(
        "Address remove error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to remove address."
      );

    }

  }
async function setDefaultAddress(
  addressId: string
) {

  const user =
    auth.currentUser;

  if (!user) {
    return;
  }

  try {

    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            "addresses"
          ),
          where(
            "userId",
            "==",
            user.uid
          )
        )
      );

    const updates =
      snapshot.docs.map(
        async (item) => {

          await updateDoc(
            doc(
              db,
              "addresses",
              item.id
            ),
            {
              isDefault:
                item.id ===
                addressId,
            }
          );

        }
      );

    await Promise.all(
      updates
    );

    await loadAddresses();

    Alert.alert(
      "Default Address",
      "Default address updated successfully."
    );

  } catch (error) {

    console.log(
      "Default address error:",
      error
    );

    Alert.alert(
      "Error",
      "Unable to update default address."
    );

  }

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
            Delivery Address
          </Text>

        </View>


        {/* ADD ADDRESS */}

        <View
          style={styles.form}
        >

          <Text
            style={styles.sectionTitle}
          >
            Add New Address
          </Text>


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
            allowFontScaling={false}
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
            allowFontScaling={false}
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
            allowFontScaling={false}
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
            allowFontScaling={false}
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
            allowFontScaling={false}
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
            allowFontScaling={false}
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

            <MaterialIcons
              name="save"
              size={19}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.saveButtonText
              }
            >
              {saving
                ? "Saving..."
                : "Save Address"}
            </Text>

          </TouchableOpacity>

        </View>


        {/* SAVED ADDRESSES */}

        <View
          style={styles.savedSection}
        >

          <Text
            style={styles.sectionTitle}
          >
            Saved Addresses
          </Text>


          {loading ? (

            <Text
              style={styles.message}
            >
              Loading addresses...
            </Text>

          ) : addresses.length === 0 ? (

            <View
              style={styles.emptyBox}
            >

              <MaterialIcons
                name="location-off"
                size={38}
                color="#BBBBBB"
              />

              <Text
                style={styles.emptyTitle}
              >
                No Saved Address
              </Text>

              <Text
                style={styles.emptyText}
              >
                Add your delivery address
                above.
              </Text>

            </View>

          ) : (

            addresses.map(
              (item) => (

                <View
                  key={item.id}
                  style={styles.addressCard}
                >

                  {/* ADDRESS DETAILS */}

                  <View
                    style={styles.addressTop}
                  >

                    <View
                      style={
                        styles.addressIcon
                      }
                    >

                      <MaterialIcons
                        name="location-on"
                        size={20}
                        color="#16A34A"
                      />

                    </View>


                    <View
                      style={
                        styles.addressDetails
                      }
                    >

                      <Text
                        style={
                          styles.addressName
                        }
                      >
                        {item.name}
                      </Text>


                      <Text
                        style={
                          styles.addressMobile
                        }
                      >
                        {item.mobile}
                      </Text>


                      <Text
                        style={
                          styles.addressText
                        }
                      >
                        {item.address}
                      </Text>


                      <Text
                        style={
                          styles.addressText
                        }
                      >
                        {item.city},{" "}
                        {item.state} -{" "}
                        {item.pincode}
                      </Text>

                    </View>

                  </View>


                  {/* ACTIONS */}

                  <View
                    style={
                      styles.addressActions
                    }
                  >

                    {/* EDIT */}

                    <TouchableOpacity
                      style={
                        styles.editButton
                      }
                      activeOpacity={0.7}
                      onPress={() =>
                        navigation.navigate(
                          "EditAddress",
                          {
                            addressId:
                              item.id,
                          }
                        )
                      }
                    >

                      <MaterialIcons
                        name="edit"
                        size={18}
                        color="#16A34A"
                      />

                      <Text
                        style={
                          styles.editText
                        }
                      >
                        Edit
                      </Text>

                    </TouchableOpacity>


                    {/* REMOVE */}

                    <TouchableOpacity
                      style={
                        styles.deleteButton
                      }
                      activeOpacity={0.7}
                      onPress={() =>
                        removeAddress(
                          item.id
                        )
                      }
                    >

                      <MaterialIcons
                        name="delete-outline"
                        size={18}
                        color="#E53935"
                      />

                      <Text
                        style={
                          styles.deleteText
                        }
                      >
                        Remove
                      </Text>

                    </TouchableOpacity>

                  </View>

                </View>

              )
            )

          )}

        </View>


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

    form: {
      backgroundColor: "#FFFFFF",
      marginTop: 7,
      padding: 14,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: "#222222",
      marginBottom: 11,
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },

    disabledButton: {
      opacity: 0.6,
    },

    saveButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800",
      marginLeft: 7,
    },

    savedSection: {
      backgroundColor: "#FFFFFF",
      marginTop: 7,
      padding: 14,
    },

    addressCard: {
      borderWidth: 1,
      borderColor: "#E5E5E5",
      borderRadius: 9,
      padding: 11,
      marginBottom: 9,
    },

    addressTop: {
      flexDirection: "row",
    },

    addressIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "#EAF8EE",
      alignItems: "center",
      justifyContent: "center",
    },

    addressDetails: {
      flex: 1,
      marginLeft: 9,
    },

    addressName: {
      fontSize: 13,
      fontWeight: "800",
      color: "#222222",
    },

    addressMobile: {
      fontSize: 11,
      color: "#666666",
      marginTop: 2,
    },

    addressText: {
      fontSize: 11,
      color: "#555555",
      lineHeight: 17,
      marginTop: 3,
    },

    addressActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: 10,
    },

    editButton: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 18,
    },

    editText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#16A34A",
      marginLeft: 4,
    },

    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
    },

    deleteText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#E53935",
      marginLeft: 4,
    },

    message: {
      fontSize: 12,
      color: "#777777",
      textAlign: "center",
      paddingVertical: 15,
    },

    emptyBox: {
      alignItems: "center",
      paddingVertical: 20,
    },

    emptyTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: "#333333",
      marginTop: 8,
    },

    emptyText: {
      fontSize: 11,
      color: "#777777",
      marginTop: 4,
    },

    bottomSpace: {
      height: 25,
    },

  });