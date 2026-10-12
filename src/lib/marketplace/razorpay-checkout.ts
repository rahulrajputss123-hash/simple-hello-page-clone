/**
 * Browser-side loader for Razorpay Checkout (https://checkout.razorpay.com/v1/checkout.js).
 * Client-only; the server never imports this.
 */

export type CheckoutSuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: { name?: string | undefined; email?: string | undefined; contact?: string | undefined };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: CheckoutSuccess) => void;
  modal?: { ondismiss?: () => void; escape?: boolean; confirm_close?: boolean };
  retry?: { enabled: boolean };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", cb: (resp: { error: { code: string; description: string; reason: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loading: Promise<void> | null = null;

export function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Checkout only runs in the browser"));
  if (window.Razorpay) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");
    const done = () => (window.Razorpay ? resolve() : reject(new Error("Razorpay failed to initialise")));
    script.addEventListener("load", done, { once: true });
    script.addEventListener(
      "error",
      () => {
        loading = null;
        reject(new Error("Couldn't load the payment form. Check your connection and try again."));
      },
      { once: true },
    );
    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return loading;
}

export function openRazorpayCheckout(options: RazorpayOptions): RazorpayInstance {
  if (!window.Razorpay) throw new Error("Razorpay checkout not loaded");
  const instance = new window.Razorpay(options);
  instance.open();
  return instance;
}