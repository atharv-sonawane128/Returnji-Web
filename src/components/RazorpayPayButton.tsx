"use client";

import { useState } from "react";
import Script from "next/script";

interface RazorpayPayButtonProps {
  amount: number; // in INR rupees (e.g. 29.00)
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure?: (error: any) => void;
  className?: string;
  buttonText?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayPayButton({
  amount,
  name = "Returnji",
  description = "Payment for order",
  prefill = {},
  onSuccess,
  onFailure,
  className = "w-full bg-dark-green text-light-beige py-4 rounded-2xl font-bricolage font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center",
  buttonText,
}: RazorpayPayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Create order on backend (amount in paise)
      const amountInPaise = Math.round(amount * 100);

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
        }),
      });

      const orderData = await res.json();

      if (!res.ok || !orderData.order_id) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // 2. Configure Razorpay modal options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: name,
        description: description,
        order_id: orderData.order_id,
        prefill: {
          name: prefill.name || "",
          email: prefill.email || "",
          contact: prefill.contact || "",
        },
        theme: {
          color: "#0F382C", // Dark green theme matching Returnji design
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // 3. Verify payment signature on backend
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              if (onSuccess) {
                onSuccess(response);
              } else {
                alert("Payment Successful!");
              }
            } else {
              throw new Error(verifyData.error || "Payment verification failed");
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            setErrorMsg(err.message || "Payment verification failed");
            if (onFailure) onFailure(err);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            console.log("Checkout modal closed by user");
          },
        },
      };

      if (typeof window !== "undefined" && window.Razorpay) {
        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on("payment.failed", function (response: any) {
          console.error("Payment failed:", response.error);
          setErrorMsg(response.error.description || "Payment failed");
          if (onFailure) onFailure(response.error);
        });
        razorpayInstance.open();
      } else {
        throw new Error("Razorpay SDK failed to load");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setErrorMsg(err.message || "Something went wrong during checkout");
      if (onFailure) onFailure(err);
      setLoading(false);
    }
  };

  return (
    <div>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptLoaded(true)}
      />
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading || !scriptLoaded}
        className={className}
      >
        {loading
          ? "Processing..."
          : !scriptLoaded
          ? "Loading Checkout..."
          : buttonText || `Pay ₹${amount.toFixed(2)} with Razorpay`}
      </button>
      {errorMsg && (
        <p className="mt-2 text-sm text-red-600 font-medium">{errorMsg}</p>
      )}
    </div>
  );
}
