"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, X, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (timeLeft <= 0) {
      router.push("/shop");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, router]);

  const handleClose = () => {
    router.push("/shop");
  };

  return (
    <main className="min-h-screen bg-bright-white/80 backdrop-blur-md pt-24 pb-20 px-4 flex items-center justify-center relative overflow-hidden">
      {/* Modal Dialog Overlay Container */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Dialog Content */}
        <div className="bg-bright-white border border-gray-200 rounded-3xl shadow-2xl max-w-lg w-full p-8 sm:p-10 relative animate-in fade-in zoom-in-95 duration-200 text-center font-bricolage">
          
          {/* Top Cross Button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-light-beige/60 hover:bg-light-beige flex items-center justify-center text-dark-green transition-colors"
            aria-label="Close dialog and return to shop"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success Animated Icon */}
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
            <CheckCircle className="w-12 h-12 stroke-[2.5]" />
          </div>

          {/* Title */}
          <h1 className="font-ultra text-3xl sm:text-4xl text-dark-green mb-3">
            ORDER PLACED!
          </h1>

          <p className="text-dark-green/80 text-base sm:text-lg mb-6 leading-relaxed">
            Thank you for shopping with <span className="font-bold text-dark-green">Returnji</span>! Your payment was verified successfully and your order has been received.
          </p>

          {/* Timer Notice Pill */}
          <div className="bg-light-beige/70 border border-dark-green/10 rounded-2xl p-4 mb-8 flex items-center justify-between text-sm font-semibold text-dark-green">
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Redirecting to Shop page...
            </span>
            <span className="bg-dark-green text-light-beige px-3 py-1 rounded-full text-xs font-bold font-mono">
              {timeLeft}s
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-dark-green text-light-beige py-3.5 px-6 rounded-2xl font-bold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
            >
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
