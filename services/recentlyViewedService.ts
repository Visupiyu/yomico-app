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