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

  // Most callers add one unit at a time and never set this, but
  // reorderItems (Buy Again) passes the original order line's
  // quantity — that was previously ignored below (new lines always
  // started at 1, existing lines always incremented by exactly 1),
  // so reordering a qty-3 line silently added only 1 unit.
  const requestedQuantity =
    Number(product.quantity) > 0
      ? Number(product.quantity)
      : 1;

  const selectedVariants =
    product.selectedVariants &&
    Object.keys(product.selectedVariants).length > 0
      ? product.selectedVariants
      : null;

  // A product with variants (e.g. size/color) needs its own cart line
  // per variant combo — merging "Size L" into an existing "Size S" line
  // would silently swap out the size the customer already chose.
  const existingDoc = snapshot.docs.find(
    (item) =>
      JSON.stringify(item.data().selectedVariants || null) ===
      JSON.stringify(selectedVariants)
  );

  if (existingDoc) {

    await updateDoc(existingDoc.ref, {
      quantity: (existingDoc.data().quantity || 1) + requestedQuantity,
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
    quantity: requestedQuantity,
    vendorId: product.vendorId,
    vendorName: product.vendorName,
    savedForLater: false,
    ...(selectedVariants ? { selectedVariants } : {}),
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