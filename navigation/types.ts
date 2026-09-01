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
        // Real YOMICO catalog-tree node ids — the same values stored on
        // product docs as `categoryId`/`subCategoryId` — NOT display
        // names. Exactly one of these two is set at a time: some
        // customer-facing categories (Men Fashion, Women Fashion) are
        // sub-categories in the real catalog, not top-level categories,
        // so they're matched via subCategoryId instead of categoryId —
        // mirrors the web's own top-level-vs-sub-category branch
        // (yogi/app/category/[name]/page.tsx). categoryName is carried
        // alongside purely for the active-category chip's label so
        // SearchScreen never has to resolve an id back to a name.
        categoryId?: string;
        subCategoryId?: string;
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