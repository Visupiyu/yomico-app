import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

import {
  getProductById,
} from "./productService";


/*
  Save a product to Recently Viewed
*/

export async function saveRecentlyViewed(
  product: any
) {

  try {

    const user =
      auth.currentUser;

    if (!user) {
      return;
    }


    if (!product?.id) {
      return;
    }


    const recentlyViewedRef =
      collection(
        db,
        "recentlyViewed"
      );


    /*
      Check whether this product
      is already in Recently Viewed
    */

    const productQuery =
      query(
        recentlyViewedRef,

        where(
          "userId",
          "==",
          user.uid
        ),

        where(
          "productId",
          "==",
          product.id
        )
      );


    const snapshot =
      await getDocs(
        productQuery
      );


    /*
      If product already exists,
      update its viewed time.
    */

    if (!snapshot.empty) {

      const existingDoc =
        snapshot.docs[0];


      await updateDoc(
        doc(
          db,
          "recentlyViewed",
          existingDoc.id
        ),
        {

          viewedAt:
            new Date(),

        }
      );


      return;

    }


    /*
      Create a new Recently Viewed item
    */

    await import(
      "firebase/firestore"
    ).then(
      async ({
        addDoc,
      }) => {

        await addDoc(
          recentlyViewedRef,
          {

            userId:
              user.uid,

            productId:
              product.id,

            name:
              product.name ||
              "",

            price:
              product.price ||
              0,

            mrp:
              product.mrp ||
              0,

            image:
              product.images?.[0] ||
              product.image ||
              "",

            vendorId:
              product.vendorId ||
              "",

            vendorName:
              product.vendorName ||
              "",

            discountPercent:
              product.discountPercent ||
              0,

            viewedAt:
              new Date(),

          }
        );

      }
    );


    /*
      Keep only the latest 10 products.
    */

    const allQuery =
      query(
        recentlyViewedRef,

        where(
          "userId",
          "==",
          user.uid
        )
      );


    const allSnapshot =
      await getDocs(
        allQuery
      );


    if (
      allSnapshot.size >
      10
    ) {

      const items =
        allSnapshot.docs
          .map(
            (item) => ({

              id:
                item.id,

              ...item.data(),

            })
          )
          .sort(
            (
              a: any,
              b: any
            ) => {

              const dateA =
                a.viewedAt
                  ?.toDate?.()
                  ?.getTime?.() ||
                new Date(
                  a.viewedAt
                ).getTime() ||
                0;

              const dateB =
                b.viewedAt
                  ?.toDate?.()
                  ?.getTime?.() ||
                new Date(
                  b.viewedAt
                ).getTime() ||
                0;

              return (
                dateB -
                dateA
              );

            }
          );


      const itemsToDelete =
        items.slice(10);


      await Promise.all(
        itemsToDelete.map(
          (item: any) =>
            deleteDoc(
              doc(
                db,
                "recentlyViewed",
                item.id
              )
            )
        )
      );

    }

  } catch (error) {

    console.log(
      "Recently Viewed Error:",
      error
    );

  }

}


/*
  Fetch the current user's Recently Viewed
  products, newest first, shaped for ProductCard.
*/

export async function getRecentlyViewed(
  limitCount: number = 8
) {

  try {

    const user =
      auth.currentUser;

    if (!user) {
      return [];
    }

    const recentlyViewedQuery =
      query(
        collection(
          db,
          "recentlyViewed"
        ),
        where(
          "userId",
          "==",
          user.uid
        )
      );

    const snapshot =
      await getDocs(
        recentlyViewedQuery
      );

    const items =
      snapshot.docs.map(
        (item) => ({
          id: item.id,
          ...item.data(),
        })
      ) as any[];

    items.sort(
      (a, b) => {

        const dateA =
          a.viewedAt
            ?.toDate?.()
            ?.getTime?.() || 0;

        const dateB =
          b.viewedAt
            ?.toDate?.()
            ?.getTime?.() || 0;

        return dateB - dateA;

      }
    );

    const recentItems =
      items.slice(0, limitCount);

    // The recentlyViewed doc only ever stores a display snapshot
    // (name/price/image at the time it was viewed) — it never had
    // stock, variants, gstPercent, or category. Returning that
    // snapshot as "the product" fed straight into ProductCard, which
    // silently skipped stock gating (undefined stock reads as always
    // in stock) and, on tap, carried the same gaps through to Product
    // Details. Fetch the live product for each item instead; fall
    // back to the cached snapshot only if it's no longer available.
    const liveProducts =
      await Promise.all(
        recentItems.map((item) =>
          item.productId
            ? getProductById(item.productId)
            : null
        )
      );

    return recentItems.map((item, index) => {

      const live = liveProducts[index];

      if (live) {
        return live;
      }

      return {
        id: item.productId,
        name: item.name,
        price: item.price,
        mrp: item.mrp,
        image: item.image,
        discountPercent: item.discountPercent,
        vendorId: item.vendorId,
        vendorName: item.vendorName,
      };

    });

  } catch (error) {

    console.log(
      "Recently Viewed Fetch Error:",
      error
    );

    return [];

  }

}