"use client";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
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
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

/**
 * Loads the Razorpay checkout.js script once and resolves when
 * window.Razorpay is available.
 */
export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Razorpay can only be loaded in the browser."),
    );
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      if (window.Razorpay) {
        resolve();
      } else {
        scriptPromise = null;
        reject(new Error("Razorpay script loaded but did not initialise."));
      }
    };

    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load the Razorpay checkout script."));
    };

    document.body.appendChild(script);
  });

  return scriptPromise;
}
