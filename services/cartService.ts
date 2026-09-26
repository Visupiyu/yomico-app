import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import { cartLineUnitPrice } from "../utils/priceRules";

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

  // The seller's own id for this exact combination — see
  // utils/variantSelection.ts. Authoritative for identity when present,
  // mirroring the web cart's isSameLine(): a line with a variantId is never
  // merged with one that lacks it, since they may be different variants
  // that happen to share a colour.
  const variantId =
    typeof product.variantId === "string" && product.variantId
      ? product.variantId
      : null;

  // A product with variants (e.g. size/color) needs its own cart line
  // per variant combo — merging "Size L" into an existing "Size S" line
  // would silently swap out the size the customer already chose.
  const existingDoc = snapshot.docs.find((item) => {
    const stored = (item.data().variantId as string) || "";
    const wanted = variantId || "";

    if (stored || wanted) return stored === wanted;

    return (
      JSON.stringify(item.data().selectedVariants || null) ===
      JSON.stringify(selectedVariants)
    );
  });

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
    ...(variantId ? { variantId } : {}),
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

  const lines: any[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // A cart line's stored price is a snapshot from when it was added, and it
  // never includes a variant's own price. The server always charges the live
  // product (utils/priceRules.ts), so re-price each line from the live product
  // document here, in memory only. If a product can't be read, the stored
  // price is kept; the server re-prices at checkout either way.
  const productIds = [
    ...new Set(
      lines
        .map((line) => line.productId)
        .filter((id): id is string => typeof id === "string" && !!id)
    ),
  ];

  const liveProducts = new Map<string, any>();

  await Promise.all(
    productIds.map(async (productId) => {
      try {
        const productSnap = await getDoc(doc(db, "products", productId));
        if (productSnap.exists()) {
          liveProducts.set(productId, productSnap.data());
        }
      } catch (error) {
        console.log("Cart price refresh skipped for a product:", error);
      }
    })
  );

  return lines.map((line) => {
    const live = liveProducts.get(line.productId);
    const livePrice = live ? cartLineUnitPrice(live, line.variantId) : 0;
    return livePrice > 0 ? { ...line, price: livePrice } : line;
  });
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