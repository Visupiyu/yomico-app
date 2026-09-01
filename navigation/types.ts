import { NavigatorScreenParams } from "@react-navigation/native";

/* =========================
   BOTTOM TAB ROUTES
========================= */

export type TabParamList = {
  HomeTab: undefined;
  LoginTab: undefined;
  CartTab: undefined;
  ProfileTab: undefined;

  // Kept for existing ProfileScreen navigation.
  // It is not displayed in the bottom bar.
  WishlistTab: undefined;
};


/* =========================
   ROOT STACK ROUTES
========================= */

export type RootStackParamList = {

  MainTabs:
    NavigatorScreenParams<TabParamList>;

  Register: undefined;

  ProductDetails: {
    product: any;
  };

  Checkout: undefined;

  Orders: undefined;

  OrderDetails: {
    order: any;
  };

  EditProfile: undefined;

  Wishlist: undefined;

  Address: undefined;

  EditAddress: {
    addressId: string;
  };

  Search:
    | {
        // Real YOMICO catalog-tree node id (e.g. "FASHION"), the same
        // value stored on product docs as `categoryId` — NOT a display
        // name. categoryName is carried alongside purely for the active
        // -category chip's label so SearchScreen never has to resolve an
        // id back to a name.
        categoryId?: string;
        categoryName?: string;
      }
    | undefined;

  ProductQuestions: {
    productId: string;
    productName: string;
    vendorId: string;
    vendorName: string;
  };

  Chat: {
    productId: string;
    productName: string;
    vendorId: string;
    vendorName: string;
  };

  Notifications: undefined;

  RecentlyViewed: undefined;

  Support:
    | {
        orderId?: string;
      }
    | undefined;
};