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

/*
  Real Firestore product documents (created by the web seller flow)
  use a different field set than this app's screens expect — title
  not name, sellingPrice not price, thumbnail/images[] not image,
  discount not discountPercent, categoryId not category, and a
  differently-shaped variants array. This is the single place that
  reconciles the two, so every screen can keep using its existing
  field names unchanged.
*/
function normalizeProduct(id: string, data: any) {

  const rawVariants = data.variants;

  /*
    Web's real variant shape ({id,attributes,stock,price}) is
    structurally different from what the variant selector UI expects
    ({label,options[]}). Passing the raw shape through would crash
    that UI (options.map on undefined), so only pass variants through
    when they already match the shape it understands.
  */
  const hasCompatibleVariantShape =
    Array.isArray(rawVariants) &&
    rawVariants.every(
      (variant: any) =>
        variant &&
        typeof variant.label === "string" &&
        Array.isArray(variant.options)
    );

  return {
    id,
    ...data,
    name: data.name || data.title || "",
    price: data.price ?? data.sellingPrice ?? 0,
    image:
      data.image ||
      data.thumbnail ||
      data.images?.[0] ||
      "",
    images: Array.isArray(data.images) ? data.images : [],
    mrp: data.mrp ?? 0,
    discountPercent: data.discountPercent ?? data.discount ?? 0,
    gstPercent: data.gstPercent || 0,
    vendorId: data.vendorId || "",
    vendorName: data.vendorName || "",
    stock: data.stock,
    category: data.category || data.categoryId || "",
    variants: hasCompatibleVariantShape ? rawVariants : [],
  };

}

export async function getProducts() {
  try {

    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const products = snapshot.docs.map((doc) =>
      normalizeProduct(doc.id, doc.data())
    );

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

    return normalizeProduct(
      snapshot.id,
      snapshot.data()
    );

  } catch (error) {

    console.log("Product Loading Error:", error);

    return null;

  }
}

export async function getProductsByCategory(categoryId: string) {
  try {

    // Real product docs store `categoryId` (a catalog-tree node id, e.g.
    // "FASHION") — the plain-text `category` field only ever exists as
    // normalizeProduct()'s own client-side convenience alias above and is
    // never written to Firestore, so a `category` query always matched
    // zero real products. This mirrors the web's own top-level category
    // query (yogi/app/category/[name]/page.tsx: `where("categoryId", "==",
    // matchedNode.id)`).
    const q = query(
      collection(db, "products"),
      where("categoryId", "==", categoryId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const products = snapshot.docs.map((doc) =>
      normalizeProduct(doc.id, doc.data())
    );

    return products;

  } catch (error) {

    console.log("Product Loading Error:", error);

    return [];

  }
}