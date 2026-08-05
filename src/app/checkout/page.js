"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { ChevronLeft, Truck, MapPin, Check, Edit3, CreditCard, ShieldCheck, ShoppingBag } from "lucide-react";

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart, directCheckoutItem, setDirectCheckoutItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Multi-step state: 1 = Address, 2 = Payment, 3 = Confirm order
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [deliveryType, setDeliveryType] = useState("pan_india"); // "pan_india" | "campus"
  
  // Input fields state
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [dropzone, setDropzone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [validationError, setValidationError] = useState("");

  const checkoutItems = directCheckoutItem ? [directCheckoutItem] : cartItems;
  const subTotal = directCheckoutItem 
    ? parseFloat(directCheckoutItem.product.price.replace(/[^0-9.]/g, '')) * directCheckoutItem.quantity 
    : cartTotal;
  const deliveryFee = deliveryType === "pan_india" ? 80 : 0;
  const finalTotal = subTotal + deliveryFee;

  // Sync user details on mount
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user) {
      if (user.email && !contactEmail) setContactEmail(user.email);
      if (user.phoneNumber && !contactPhone) setContactPhone(user.phoneNumber.replace(/^\+91/, '').trim());
    }
  }, [user, router, contactEmail, contactPhone]);

  const firstName = user?.displayName ? user.displayName.split(" ")[0] : "";
  const lastName = user?.displayName ? user.displayName.split(" ").slice(1).join(" ") : "";

  // Step 1 Validation -> Proceed to Payment
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setValidationError("");

    if (!contactEmail.trim()) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    if (!contactPhone.trim() || contactPhone.trim().length < 10) {
      setValidationError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (deliveryType === "pan_india") {
      if (!address.trim()) {
        setValidationError("Please enter your street address.");
        return;
      }
      if (!city.trim()) {
        setValidationError("Please enter your city.");
        return;
      }
      if (!pincode.trim() || pincode.trim().length < 6) {
        setValidationError("Please enter a valid 6-digit postal pincode.");
        return;
      }
    } else {
      if (!dropzone.trim()) {
        setValidationError("Please select a Parul University campus pickup dropzone.");
        return;
      }
    }

    setCurrentStep(2);
  };

  // Step 2 Validation -> Proceed to Confirm Order
  const handleProceedToConfirm = (e) => {
    e.preventDefault();
    setCurrentStep(3);
  };

  // Final Submit Handler (Step 3 Confirm Order & Pay)
  const handleFinalOrderPayment = async () => {
    setIsSubmitting(true);

    try {
      const enteredEmail = contactEmail;
      const enteredPhone = `+91${contactPhone.replace(/^\+91/, '').trim()}`;

      let deliveryDetails = {};
      let dropzoneValue = "";

      if (deliveryType === "campus") {
        dropzoneValue = dropzone;
        deliveryDetails = {
          deliveryType: "campus",
          isStudent: true,
          dropzone: dropzoneValue,
          deliveryFee: 0,
        };
      } else {
        dropzoneValue = `${address}, ${city}${stateName ? `, ${stateName}` : ""} - ${pincode}`;
        deliveryDetails = {
          deliveryType: "pan_india",
          isStudent: false,
          address: address,
          city: city,
          state: stateName,
          pincode: pincode,
          deliveryFee: 80,
        };
      }

      // Generate local order/receipt ID
      const receiptId = `rcpt_${Date.now()}`;

      if (!finalTotal || isNaN(finalTotal) || finalTotal < 1) {
        throw new Error("Order amount must be at least ₹1.");
      }

      // 1. Create order on backend (in paise)
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(finalTotal * 100),
          currency: "INR",
          receipt: receiptId.slice(0, 40),
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.order_id) {
        throw new Error(orderData.error || `Server returned ${res.status}: Failed to create Razorpay order`);
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Returnji",
        description: "Order Payment",
        order_id: orderData.order_id,
        prefill: {
          name: `${firstName} ${lastName}`.trim() || "Customer",
          email: enteredEmail,
          contact: enteredPhone,
        },
        theme: {
          color: "#0F382C",
        },
        handler: async function (response) {
          try {
            // 3. Verify Payment Signature
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
              // Save confirmed order to Firestore only after payment success
              try {
                await addDoc(collection(db, "orders"), {
                  userId: user?.uid || "guest",
                  customerName: `${firstName} ${lastName}`.trim() || "Customer",
                  email: enteredEmail,
                  phone: enteredPhone,
                  items: checkoutItems.map(item => ({
                    productId: item.product.id,
                    name: item.product.name,
                    price: item.product.price,
                    quantity: item.quantity,
                    image: item.product.image
                  })),
                  subTotal: subTotal,
                  deliveryFee: deliveryFee,
                  totalAmount: finalTotal,
                  deliveryDetails: deliveryDetails,
                  dropzone: dropzoneValue,
                  paymentMethod: "razorpay",
                  paymentStatus: "paid",
                  adminStatus: "confirmed",
                  userTrackingStatus: "confirmed",
                  pickupOtp: String(Math.floor(100000 + Math.random() * 900000)),
                  status: "confirmed",
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  createdAt: serverTimestamp(),
                  paidAt: serverTimestamp(),
                });
              } catch (dbErr) {
                console.warn("Firestore save failed:", dbErr);
              }

              if (directCheckoutItem) {
                setDirectCheckoutItem(null);
              } else {
                clearCart();
              }
              router.push("/checkout/success");
            } else {
              alert(`Payment verification failed: ${verifyData.error || "Invalid signature"}`);
              setIsSubmitting(false);
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Error verifying payment. Please contact support.");
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          },
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          alert(`Payment failed: ${response.error?.description || "Transaction rejected"}`);
          setIsSubmitting(false);
        });
        rzp.open();
      } else {
        alert("Razorpay SDK failed to load. Please check your connection.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error processing order: ", error);
      alert(error.message || "There was an error processing your order. Please try again.");
      setIsSubmitting(false);
    }
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
    <main className="min-h-screen bg-bright-white pt-20 pb-20 px-4 sm:px-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="max-w-5xl mx-auto">

        {/* Back Link */}
        <Link href="/shop" className="inline-flex items-center text-dark-green font-bricolage font-bold mb-6 hover:opacity-70 transition-opacity text-sm">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Shop
        </Link>

        {/* Amazon-style Progress Stepper Bar Header */}
        <div className="w-full max-w-3xl mx-auto mb-10 select-none px-2 font-bricolage">
          <div className="flex items-center justify-between relative">
            {/* Background Track Line */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-stone-200 -translate-y-1/2 z-0">
              <div 
                className="h-full bg-dark-green transition-all duration-300" 
                style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
              />
            </div>

            {/* Step 1: Address */}
            <button
              type="button"
              onClick={() => currentStep > 1 && setCurrentStep(1)}
              className={`relative z-10 flex flex-col items-center gap-1.5 focus:outline-none ${currentStep >= 1 ? 'text-dark-green' : 'text-stone-400'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all border-2 ${
                currentStep > 1 
                  ? 'bg-dark-green text-white border-dark-green' 
                  : currentStep === 1 
                  ? 'bg-white border-dark-green text-dark-green ring-4 ring-dark-green/15' 
                  : 'bg-stone-100 border-stone-300 text-stone-400'
              }`}>
                {currentStep > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <span className="text-xs sm:text-sm font-bold tracking-wide">Address</span>
            </button>

            {/* Step 2: Payment */}
            <button
              type="button"
              onClick={() => currentStep > 2 && setCurrentStep(2)}
              className={`relative z-10 flex flex-col items-center gap-1.5 focus:outline-none ${currentStep > 1 ? 'cursor-pointer' : 'cursor-not-allowed'} ${currentStep >= 2 ? 'text-dark-green' : 'text-stone-400'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all border-2 ${
                currentStep > 2 
                  ? 'bg-dark-green text-white border-dark-green' 
                  : currentStep === 2 
                  ? 'bg-white border-dark-green text-dark-green ring-4 ring-dark-green/15' 
                  : 'bg-stone-100 border-stone-300 text-stone-400'
              }`}>
                {currentStep > 2 ? <Check className="w-4 h-4" /> : "2"}
              </div>
              <span className="text-xs sm:text-sm font-bold tracking-wide">Payment</span>
            </button>

            {/* Step 3: Confirm order */}
            <div className={`relative z-10 flex flex-col items-center gap-1.5 ${currentStep >= 3 ? 'text-dark-green' : 'text-stone-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all border-2 ${
                currentStep === 3 
                  ? 'bg-white border-dark-green text-dark-green ring-4 ring-dark-green/15 font-black' 
                  : 'bg-stone-100 border-stone-300 text-stone-400'
              }`}>
                3
              </div>
              <span className="text-xs sm:text-sm font-bold tracking-wide">Confirm order</span>
            </div>
          </div>
        </div>

        {/* STEP 1: ADDRESS & DELIVERY DETAILS */}
        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto font-bricolage bg-bright-white p-6 sm:p-8 rounded-[2rem] border border-gray-200/80 shadow-xs">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-green mb-6">1. Select Delivery & Enter Address</h1>

            {validationError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
                ⚠️ {validationError}
              </div>
            )}

            <form onSubmit={handleProceedToPayment} className="space-y-6">
              {/* Contact Information */}
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-dark-green">Contact Information</h2>
                <div>
                  <label className="block text-xs font-bold text-dark-green uppercase mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    required 
                    value={contactEmail} 
                    onChange={(e) => setContactEmail(e.target.value)} 
                    placeholder="name@example.com" 
                    className="w-full px-4 py-3 bg-light-beige/30 border border-gray-200 rounded-xl focus:outline-none focus:border-dark-green focus:ring-1 focus:ring-dark-green transition-colors text-dark-green text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-green uppercase mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex bg-light-beige/30 border border-gray-200 rounded-xl focus-within:border-dark-green focus-within:ring-1 focus-within:ring-dark-green transition-colors overflow-hidden">
                    <span className="flex items-center px-4 font-bold bg-light-beige/50 border-r border-gray-200 text-dark-green select-none text-sm">
                      +91
                    </span>
                    <input 
                      type="tel" 
                      required 
                      value={contactPhone} 
                      onChange={(e) => setContactPhone(e.target.value)} 
                      placeholder="10-digit mobile number" 
                      className="w-full px-4 py-3 bg-transparent focus:outline-none text-dark-green text-sm" 
                    />
                  </div>
                </div>
              </section>

              {/* Delivery Method Selection */}
              <section className="space-y-4 pt-4 border-t border-gray-100">
                <h2 className="text-lg font-bold text-dark-green">Delivery Method</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setDeliveryType("pan_india")}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between ${
                      deliveryType === "pan_india"
                        ? "border-dark-green bg-light-beige/50 ring-2 ring-dark-green/20"
                        : "border-gray-200 bg-white hover:bg-light-beige/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deliveryTypeRadio"
                        checked={deliveryType === "pan_india"}
                        onChange={() => setDeliveryType("pan_india")}
                        className="mt-1 w-4 h-4 text-dark-green focus:ring-dark-green"
                      />
                      <div>
                        <span className="font-bold text-dark-green block text-sm sm:text-base">📦 Pan India Delivery</span>
                        <span className="text-xs text-dark-green/70 mt-0.5 block">Doorstep delivery (+ ₹80 standard fee)</span>
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setDeliveryType("campus")}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between ${
                      deliveryType === "campus"
                        ? "border-dark-green bg-light-beige/50 ring-2 ring-dark-green/20"
                        : "border-gray-200 bg-white hover:bg-light-beige/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deliveryTypeRadio"
                        checked={deliveryType === "campus"}
                        onChange={() => setDeliveryType("campus")}
                        className="mt-1 w-4 h-4 text-dark-green focus:ring-dark-green"
                      />
                      <div>
                        <span className="font-bold text-dark-green block text-sm sm:text-base">🎓 Parul Campus Pickup</span>
                        <span className="text-xs text-dark-green/70 mt-0.5 block">Pickup from dropzone (FREE)</span>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Pan India Address Fields */}
                {deliveryType === "pan_india" && (
                  <div className="space-y-4 bg-light-beige/20 p-5 rounded-2xl border border-gray-200/80 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-dark-green uppercase mb-1">
                        Street Address / House No. <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Building, Flat, Street Address"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-dark-green text-dark-green text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-dark-green uppercase mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-dark-green text-dark-green text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-dark-green uppercase mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="state"
                          required
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                          placeholder="State"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-dark-green text-dark-green text-sm"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-dark-green uppercase mb-1">
                          Pincode <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          required
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="6-digit Pincode"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-dark-green text-dark-green text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Campus Dropzone Selector */}
                {deliveryType === "campus" && (
                  <div className="space-y-4 bg-light-beige/20 p-5 rounded-2xl border border-gray-200/80 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-dark-green uppercase mb-1">
                        Select Pickup Dropzone <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={dropzone}
                        onChange={(e) => setDropzone(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-dark-green text-dark-green appearance-none text-sm font-medium"
                      >
                        <option value="" disabled>Choose a pickup location...</option>
                        <option value="Tasty Vadapav, Near supermart">Tasty Vadapav, Near supermart</option>
                        <option value="Krishna FoodCourt, Architecture Building">Krishna FoodCourt, Architecture Building</option>
                        <option value="Dream & Drazzle, Capitol FoodCout">Dream & Drazzle, Capitol FoodCout</option>
                      </select>
                    </div>

                    <div className="bg-light-beige/60 p-3.5 rounded-xl border border-gray-200 flex items-start gap-3">
                      <span className="text-lg">📍</span>
                      <p className="text-xs text-dark-green font-medium leading-relaxed">
                        <span className="font-bold">Note:</span> You will receive a notification as soon as your order is ready for pickup at your selected dropzone.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <button
                type="submit"
                className="w-full bg-dark-green text-white py-4 rounded-2xl font-bold text-base sm:text-lg hover:opacity-90 transition-opacity shadow-md mt-6 cursor-pointer"
              >
                Continue
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: PAYMENT METHOD */}
        {currentStep === 2 && (
          <div className="max-w-2xl mx-auto font-bricolage bg-bright-white p-6 sm:p-8 rounded-[2rem] border border-gray-200/80 shadow-xs">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-green mb-6">2. Select Payment Method</h1>

            {/* Selected Address Summary Preview */}
            <div className="mb-6 bg-light-beige/30 p-4 rounded-2xl border border-gray-200/80 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-dark-green/70">Delivering to</span>
                <p className="text-sm font-bold text-dark-green">
                  {deliveryType === "campus" ? `🎓 Parul Campus Dropzone: ${dropzone}` : `📦 ${address}, ${city}${stateName ? `, ${stateName}` : ""} - ${pincode}`}
                </p>
                <p className="text-xs text-dark-green/70">{contactEmail} | +91 {contactPhone}</p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-bold text-dark-green underline hover:opacity-70 shrink-0"
              >
                Change
              </button>
            </div>

            <form onSubmit={handleProceedToConfirm} className="space-y-6">
              <section className="space-y-3">
                <label className="flex items-center p-4 border-2 border-dark-green bg-light-beige/50 rounded-2xl cursor-pointer">
                  <input type="radio" name="paymentMethodRadio" value="upi" checked readOnly className="w-4 h-4 text-dark-green focus:ring-dark-green" />
                  <div className="ml-3">
                    <span className="font-bold text-dark-green text-sm sm:text-base block">Razorpay (UPI, GPay, PhonePe, Cards, NetBanking)</span>
                    <span className="text-xs text-dark-green/70">Instant, 100% secure payment verification</span>
                  </div>
                </label>
              </section>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-1/3 border border-gray-300 text-dark-green py-4 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-dark-green text-white py-4 rounded-2xl font-bold text-base hover:opacity-90 transition-opacity shadow-md cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: CONFIRM ORDER & REVIEW (AMAZON STYLE REVIEW) */}
        {currentStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-bricolage">
            {/* Left Main Review Section */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Delivery Address Summary Box */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-dark-green font-bold text-base">
                    <MapPin className="w-5 h-5" />
                    <span>Shipping & Delivery Details</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-dark-green hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                <div className="text-sm text-dark-green/90 space-y-1 bg-light-beige/30 p-4 rounded-2xl">
                  {deliveryType === "campus" ? (
                    <>
                      <p className="font-bold text-dark-green">🎓 Parul University Campus Pickup</p>
                      <p className="text-dark-green/80 font-medium">Selected Dropzone: <strong>{dropzone}</strong></p>
                      <p className="text-xs text-emerald-800 font-bold bg-emerald-100 w-fit px-2 py-0.5 rounded mt-1">FREE Campus Pickup</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-dark-green">📦 Pan India Home Delivery</p>
                      <p className="font-medium text-dark-green/80">{address}, {city}{stateName ? `, ${stateName}` : ""} - {pincode}</p>
                      <p className="text-xs text-amber-900 font-bold bg-amber-100 w-fit px-2 py-0.5 rounded mt-1">+ ₹80 Standard Shipping</p>
                    </>
                  )}
                  <p className="text-xs text-stone-500 pt-1">Contact: {contactEmail} | +91 {contactPhone}</p>
                </div>
              </div>

              {/* Payment Method Summary Box */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-dark-green font-bold text-base">
                    <CreditCard className="w-5 h-5" />
                    <span>Payment Method</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-dark-green hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                <div className="text-sm font-semibold text-dark-green bg-light-beige/30 p-4 rounded-2xl flex items-center justify-between">
                  <span>Razorpay (UPI, GPay, Cards, NetBanking)</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">Ready</span>
                </div>
              </div>

              {/* Items Review Box */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
                <h2 className="font-bold text-dark-green text-base mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  <span>Items in Order ({checkoutItems.length})</span>
                </h2>

                <div className="space-y-4">
                  {checkoutItems.map((item) => (
                    <div key={item.product.id} className="flex gap-4 items-center bg-stone-50/70 p-3.5 rounded-2xl border border-stone-100">
                      <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-200 relative">
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        <span className="absolute -top-1.5 -right-1.5 bg-dark-green text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-dark-green text-sm sm:text-base">{item.product.name}</h3>
                        <p className="text-xs text-stone-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="font-bold text-dark-green text-sm sm:text-base">
                        {item.product.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Sticky Order Summary Box */}
            <div className="lg:col-span-5">
              <div className="bg-light-beige/30 border border-gray-200/90 rounded-[2rem] p-6 sm:p-8 sticky top-24 shadow-sm">
                <h2 className="font-ultra text-2xl text-dark-green mb-6">Confirm Order</h2>

                <div className="border-t border-b border-gray-200 py-4 space-y-3 font-bricolage text-sm text-dark-green/80">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span className="font-bold text-dark-green">₹{subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Delivery Charge</span>
                    {deliveryType === "pan_india" ? (
                      <span className="font-bold text-dark-green text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        + ₹80.00
                      </span>
                    ) : (
                      <span className="text-emerald-800 font-bold text-xs bg-emerald-100 px-2 py-0.5 rounded">
                        FREE
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pb-6 flex justify-between items-center font-bricolage">
                  <span className="text-lg font-extrabold text-dark-green">Total Payable</span>
                  <span className="text-2xl font-black text-dark-green">₹{finalTotal.toFixed(2)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleFinalOrderPayment}
                  disabled={isSubmitting}
                  className="w-full bg-dark-green text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-lg cursor-pointer"
                >
                  {isSubmitting ? "Processing..." : `Pay Now (₹${finalTotal.toFixed(2)})`}
                </button>

                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-500 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>256-bit SSL Encrypted & Secure Payment</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
