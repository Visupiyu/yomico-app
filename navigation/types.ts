import { NavigatorScreenParams } from "@react-navigation/native";

/**
 * Routes that live INSIDE the bottom tab bar.
 * These names must NOT be repeated in RootStackParamList.
 */
export type TabParamList = {
  HomeTab: undefined;
  CartTab: undefined;
  WishlistTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;

  MainTabs: NavigatorScreenParams<TabParamList> | undefined;

  Login: undefined;
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

  Address: undefined;

  EditAddress: {
    addressId: string;
  };

  Search:
    | {
        category?: string;
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