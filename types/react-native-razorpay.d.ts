// react-native-razorpay ships no TypeScript types of its own (its `main`,
// RazorpayCheckout.js, is plain JS — see node_modules/react-native-razorpay).
// Minimal ambient typing for the one entry point CheckoutScreen.tsx uses.
declare module "react-native-razorpay" {
  export type RazorpayCheckoutOptions = {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name?: string;
    description?: string;
    image?: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    theme?: {
      color?: string;
    };
    [key: string]: unknown;
  };

  export type RazorpaySuccessResult = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };

  export type RazorpayErrorResult = {
    code?: number;
    description?: string;
    error?: { code?: number; description?: string; [key: string]: unknown };
    [key: string]: unknown;
  };

  export default class RazorpayCheckout {
    static open(options: RazorpayCheckoutOptions): Promise<RazorpaySuccessResult>;
    static onExternalWalletSelection(
      callback: (data: { external_wallet?: string }) => void
    ): void;
  }
}
