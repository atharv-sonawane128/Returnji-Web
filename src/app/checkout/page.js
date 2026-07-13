"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart, directCheckoutItem, setDirectCheckoutItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isStudent, setIsStudent] = useState(false);

  const checkoutItems = directCheckoutItem ? [directCheckoutItem] : cartItems;
  const checkoutTotal = directCheckoutItem 
    ? parseFloat(directCheckoutItem.product.price.replace(/[^0-9.]/g, '')) * directCheckoutItem.quantity 
    : cartTotal;

  // Protect route
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user && !user.phoneNumber) {
      router.push("/verify-phone");
    }
  }, [user, router]);

  const firstName = user?.displayName ? user.displayName.split(" ")[0] : "";
  const lastName = user?.displayName ? user.displayName.split(" ").slice(1).join(" ") : "";
  const email = user?.email || "";
  const phone = user?.phoneNumber || "";

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate network request
    setTimeout(() => {
      if (directCheckoutItem) {
        setDirectCheckoutItem(null);
      } else {
        clearCart();
      }
      router.push("/checkout/success");
    }, 1500);
  };

  if (checkoutItems.length === 0 && !isSubmitting) {
    return (
      <main className="min-h-screen bg-bright-white pt-24 px-4 flex flex-col items-center">
        <h1 className="font-ultra text-4xl text-dark-green mb-6">Your Cart is Empty</h1>
        <Link href="/shop" className="bg-dark-green text-light-beige px-8 py-4 rounded-full font-bricolage font-bold hover:opacity-90">
          Go Back to Shop
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bright-white pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* Left Column - Form */}
        <div className="lg:col-span-7">
          <Link href="/shop" className="inline-flex items-center text-dark-green font-bricolage font-bold mb-8 hover:opacity-70 transition-opacity">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Shop
          </Link>

          <h1 className="font-ultra text-4xl sm:text-5xl text-dark-green mb-10">CHECKOUT</h1>

          <form onSubmit={handleSubmit} className="space-y-8 font-bricolage">

            {/* Contact Info */}
            <section>
              <h2 className="text-xl font-bold text-dark-green mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <input type="email" required defaultValue={email} placeholder="Email address" className="w-full px-4 py-3 bg-light-beige/30 border border-gray-200 rounded-xl focus:outline-none focus:border-dark-green focus:ring-1 focus:ring-dark-green transition-colors text-dark-green placeholder-dark-green/50" />
                </div>
                <div>
                  <div className="flex bg-light-beige/30 border border-gray-200 rounded-xl focus-within:border-dark-green focus-within:ring-1 focus-within:ring-dark-green transition-colors overflow-hidden">
                    <span className="flex items-center px-4 font-bold bg-light-beige/50 border-r border-gray-200 text-dark-green select-none">
                      +91
                    </span>
                    <input type="tel" required defaultValue={phone.replace(/^\+91/, '').trim()} placeholder="Phone number" className="w-full px-4 py-3 bg-transparent focus:outline-none text-dark-green placeholder-dark-green/50" />
                  </div>
                </div>
              </div>
            </section>

            {/* Delivery Details */}
            <section>
              <h2 className="text-xl font-bold text-dark-green mb-4">Delivery Details</h2>
              <div className="space-y-4">

                <label className={`flex items-start p-4 border rounded-xl cursor-pointer transition-colors ${isStudent ? 'border-dark-green bg-light-beige/30' : 'border-gray-200 bg-bright-white hover:bg-light-beige/10'}`}>
                  <input type="checkbox" checked={isStudent} onChange={(e) => setIsStudent(e.target.checked)} className="mt-1 w-4 h-4 text-dark-green focus:ring-dark-green border-gray-300 rounded" />
                  <span className="ml-3 font-semibold text-dark-green">
                    I am a student of Parul University.
                    <span className="block text-sm font-normal text-dark-green/70 mt-1">Currently, we only deliver inside the Parul University campus.</span>
                  </span>
                </label>

                {isStudent && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-dark-green mb-2">Select Dropzone</label>
                      <select required defaultValue="" className="w-full px-4 py-3 bg-light-beige/30 border border-gray-200 rounded-xl focus:outline-none focus:border-dark-green focus:ring-1 focus:ring-dark-green transition-colors text-dark-green appearance-none">
                        <option value="" disabled>Choose a pickup location...</option>
                        <option value="tasty vadapav">Tasty Vadapav, Near supermart</option>
                        <option value="jagdish foods">Jagdish Foods, New FoodCourt</option>
                        <option value="krishna foodcourt">Krishna FoodCourt, Architecture Building</option>
                        <option value="d&d">Dream & Drazzle, Capitol FoodCout</option>
                        <option value="mogal mug pulav">Mogal Mug Pulav, PTI FoodCourt</option>
                        <option value="mr puff">Mr. Puff, PTI, Near CBI Bank</option>
                        <option value="sanwariyaa chaat">Sanwariyaa Chaat Corner, PTI FoodCourt</option>
                      </select>
                    </div>

                    <div className="bg-light-beige/50 p-4 rounded-xl border border-gray-200 flex items-start gap-3">
                      <span className="text-xl">📍</span>
                      <p className="text-sm text-dark-green font-medium">
                        <span className="font-bold">Note:</span> You will receive a notification as soon as your order is ready for pickup at your selected dropzone.
                      </p>
                    </div>
                  </>
                )}

              </div>
            </section>

            {isStudent && (
              <>
                {/* Payment Info */}
                <section>
                  <h2 className="text-xl font-bold text-dark-green mb-4">Payment Method</h2>
                  <div className="space-y-3">
                    <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'upi' ? 'border-dark-green bg-light-beige/50' : 'border-gray-200 hover:bg-light-beige/30'}`}>
                      <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} className="w-4 h-4 text-dark-green focus:ring-dark-green border-gray-300" />
                      <span className="ml-3 font-semibold text-dark-green">UPI (GPay, PhonePe, Paytm)</span>
                    </label>
                    <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'credit' ? 'border-dark-green bg-light-beige/50' : 'border-gray-200 hover:bg-light-beige/30'}`}>
                      <input type="radio" name="payment" value="credit" checked={paymentMethod === 'credit'} onChange={() => setPaymentMethod('credit')} className="w-4 h-4 text-dark-green focus:ring-dark-green border-gray-300" />
                      <span className="ml-3 font-semibold text-dark-green">Credit Card</span>
                    </label>
                    <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'debit' ? 'border-dark-green bg-light-beige/50' : 'border-gray-200 hover:bg-light-beige/30'}`}>
                      <input type="radio" name="payment" value="debit" checked={paymentMethod === 'debit'} onChange={() => setPaymentMethod('debit')} className="w-4 h-4 text-dark-green focus:ring-dark-green border-gray-300" />
                      <span className="ml-3 font-semibold text-dark-green">Debit Card</span>
                    </label>
                  </div>
                </section>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-dark-green text-light-beige py-4 rounded-2xl font-bricolage font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {isSubmitting ? "Processing..." : `Place Pre-Order (₹${checkoutTotal.toFixed(2)})`}
                </button>
              </>
            )}
          </form>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-light-beige/30 border border-gray-100 rounded-[2rem] p-6 sm:p-8 sticky top-24">
            <h2 className="font-ultra text-2xl text-dark-green mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto scrollbar-hide">
              {checkoutItems.map((item) => (
                <div key={item.product.id} className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-bright-white rounded-xl overflow-hidden shrink-0 border border-gray-100 relative">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    <span className="absolute -top-2 -right-2 bg-dark-green text-light-beige text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 font-bricolage">
                    <h3 className="font-bold text-dark-green text-sm">{item.product.name}</h3>
                  </div>
                  <div className="font-bricolage font-bold text-dark-green text-sm">
                    {item.product.price}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3 font-bricolage text-sm text-dark-green/70">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-dark-green">₹{checkoutTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="text-dark-green font-bold text-sm bg-light-beige px-2 py-0.5 rounded">Free Pickup</span>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center font-bricolage">
              <span className="text-lg font-bold text-dark-green">Total</span>
              <span className="text-2xl font-bold text-dark-green">₹{checkoutTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
