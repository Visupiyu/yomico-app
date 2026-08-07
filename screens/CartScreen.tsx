import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";

import {
  getCartItems,
  updateCartQuantity,
  removeCartItem,
} from "../services/cartService";

import { MaterialIcons } from "@expo/vector-icons";

export default function CartScreen() {

  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    const data = await getCartItems();
    setCartItems(data);
  }

  async function increase(item: any) {
    await updateCartQuantity(
      item.id,
      item.quantity + 1
    );
    loadCart();
  }

  async function decrease(item: any) {

    if (item.quantity === 1) {
      remove(item);
      return;
    }

    await updateCartQuantity(
      item.id,
      item.quantity - 1
    );

    loadCart();

  }

  async function remove(item: any) {

    await removeCartItem(item.id);

    Alert.alert(
      "Removed",
      "Product removed from cart."
    );

    loadCart();

  }

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  const shipping =
    subtotal > 500 ? 0 : 50;

  const total =
    subtotal + shipping;

  return (

    <SafeAreaView style={styles.container}>

      <Text style={styles.title}>
        My Cart
      </Text>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (

          <View style={styles.card}>

            <Image
              source={{
                uri: item.image,
              }}
              style={styles.image}
            />

            <View style={styles.info}>

              <Text
                numberOfLines={2}
                style={styles.name}
              >
                {item.name}
              </Text>

              <Text style={styles.price}>
                ₹{item.price}
              </Text>

              <View style={styles.qtyRow}>

                <TouchableOpacity
                  onPress={() =>
                    decrease(item)
                  }
                >
                  <MaterialIcons
                    name="remove-circle"
                    size={30}
                    color="#E53935"
                  />
                </TouchableOpacity>

                <Text style={styles.qty}>
                  {item.quantity}
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    increase(item)
                  }
                >
                  <MaterialIcons
                    name="add-circle"
                    size={30}
                    color="#16A34A"
                  />
                </TouchableOpacity>

              </View>

              <TouchableOpacity
                onPress={() =>
                  remove(item)
                }
              >
                <Text style={styles.remove}>
                  Remove
                </Text>
              </TouchableOpacity>

            </View>

          </View>

        )}

        ListFooterComponent={

          <View style={styles.summary}>

            <Text>
              Subtotal : ₹{subtotal}
            </Text>

            <Text>
              Shipping : ₹{shipping}
            </Text>

            <Text style={styles.total}>
              Total : ₹{total}
            </Text>

            <TouchableOpacity
              style={styles.checkoutButton}
            >

              <Text
                style={styles.checkoutText}
              >
                Proceed To Checkout
              </Text>

            </TouchableOpacity>

          </View>

        }

      />

    </SafeAreaView>

  );

}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#fff",
  },

  title:{
    fontSize:28,
    fontWeight:"bold",
    padding:20,
  },

  card:{
    flexDirection:"row",
    padding:15,
    borderBottomWidth:1,
    borderColor:"#eee",
  },

  image:{
    width:100,
    height:100,
    borderRadius:10,
  },

  info:{
    flex:1,
    marginLeft:15,
  },

  name:{
    fontSize:16,
    fontWeight:"600",
  },

  price:{
    marginTop:5,
    color:"#16A34A",
    fontWeight:"bold",
    fontSize:18,
  },

  qtyRow:{
    flexDirection:"row",
    alignItems:"center",
    marginTop:12,
  },

  qty:{
    marginHorizontal:15,
    fontSize:18,
    fontWeight:"bold",
  },

  remove:{
    color:"red",
    marginTop:12,
    fontWeight:"600",
  },

  summary:{
    padding:20,
  },

  total:{
    fontSize:22,
    fontWeight:"bold",
    marginTop:10,
  },

  checkoutButton:{
    backgroundColor:"#16A34A",
    padding:16,
    borderRadius:12,
    alignItems:"center",
    marginTop:20,
  },

  checkoutText:{
    color:"#fff",
    fontWeight:"bold",
    fontSize:18,
  },

});