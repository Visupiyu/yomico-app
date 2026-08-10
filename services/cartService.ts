import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

export async function addToCart(product: any) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in");
  }

  const cartRef = collection(db, "cart");

  const q = query(
    cartRef,
    where("userId", "==", user.uid),
    where("productId", "==", product.id)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const cartDoc = snapshot.docs[0];

    await updateDoc(cartDoc.ref, {
      quantity: (cartDoc.data().quantity || 1) + 1,
      savedForLater: false,
    });

    return;
  }

  await addDoc(cartRef, {
    userId: user.uid,
    productId: product.id,
    name: product.name,
    image: product.image,
    price: product.price,
    mrp: product.mrp,
    discountPercent: product.discountPercent,
    gstPercent: product.gstPercent || 0,
    quantity: 1,
    vendorId: product.vendorId,
    vendorName: product.vendorName,
    savedForLater: false,
  });
}

export async function moveToSavedForLater(cartId: string) {
  await updateDoc(
    doc(db, "cart", cartId),
    {
      savedForLater: true,
    }
  );
}

export async function moveToCart(cartId: string) {
  await updateDoc(
    doc(db, "cart", cartId),
    {
      savedForLater: false,
    }
  );
}

export async function getCartItems() {
  const user = auth.currentUser;

  if (!user) return [];

  const q = query(
    collection(db, "cart"),
    where("userId", "==", user.uid)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function updateCartQuantity(
  cartId: string,
  quantity: number
) {
  await updateDoc(
    doc(db, "cart", cartId),
    {
      quantity,
    }
  );
}

export async function removeCartItem(
  cartId: string
) {
  await deleteDoc(
    doc(db, "cart", cartId)
  );
}