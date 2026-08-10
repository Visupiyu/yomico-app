import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export async function getProducts() {
  try {

    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return products;

  } catch (error) {

    console.log("Product Loading Error:", error);

    return [];

  }
}

export async function getProductById(id: string) {
  try {

    const snapshot = await getDoc(
      doc(db, "products", id)
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };

  } catch (error) {

    console.log("Product Loading Error:", error);

    return null;

  }
}

export async function getProductsByCategory(category: string) {
  try {

    const q = query(
      collection(db, "products"),
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return products;

  } catch (error) {

    console.log("Product Loading Error:", error);

    return [];

  }
}