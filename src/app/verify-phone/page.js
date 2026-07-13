"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Phone, KeyRound } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function VerifyPhonePage() {
  const { user, sendPhoneVerification, setupRecaptcha } = useAuth();
  const router = useRouter();
  
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // If not logged in, go to login
    if (!user) {
      router.push("/login");
    } else if (user.phoneNumber) {
      // If already verified, go to shop
      router.push("/shop");
    }
  }, [user, router]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError("Please enter a valid phone number.");
      return;
    }

    let formattedPhone = phone;
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+91" + formattedPhone;
    }

    setIsSending(true);
    setError("");

    try {
      const recaptchaVerifier = setupRecaptcha('recaptcha-container');
      const confirmation = await sendPhoneVerification(formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
    } catch (e) {
      console.error(e);
      if (e.code === 'auth/invalid-phone-number') {
         setError("Invalid phone number format.");
      } else {
         setError("Failed to send OTP. Ensure phone number is valid and try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;

    setIsVerifying(true);
    setError("");

    try {
      // Confirm the OTP
      const result = await confirmationResult.confirm(otp);
      
      try {
        // Also save the phone in firestore just to be safe and consistent
        await setDoc(doc(db, "users", user.uid), {
          phone: result.user.phoneNumber
        }, { merge: true });
      } catch (firestoreError) {
        console.warn("Firestore save failed, but phone was linked successfully:", firestoreError);
        // We don't want to block the user if they haven't set up Firestore yet.
      }

      // User object in context will update automatically because Auth State changes when linked
      // Force a hard reload if router.push doesn't trigger the context update
      window.location.href = "/shop";
    } catch (e) {
      console.error("OTP Verification Error:", e);
      setError(`Verification failed: ${e.message || "Invalid OTP"}`);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!user) return null; // Avoid flicker

  return (
    <main className="min-h-screen bg-bright-white flex flex-col items-center justify-center p-4">
      <div className="bg-light-beige/30 p-8 sm:p-12 rounded-[2rem] border border-gray-100 max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="font-ultra text-3xl text-dark-green">Verify Phone</h1>
          <p className="font-bricolage text-dark-green/70">
            To complete your account setup, please verify your phone number. This helps us ensure smooth delivery.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl font-bricolage text-sm font-semibold text-center">
            {error}
          </div>
        )}

        {!confirmationResult ? (
          <form onSubmit={handleSendOtp} className="space-y-4 font-bricolage">
            <div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-green/50" />
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number (e.g. 9876543210)" 
                  className="w-full pl-12 pr-4 py-3 bg-bright-white border border-gray-200 rounded-xl focus:outline-none focus:border-dark-green focus:ring-1 focus:ring-dark-green transition-colors text-dark-green placeholder-dark-green/50" 
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSending}
              className="w-full flex items-center justify-center gap-3 bg-dark-green text-light-beige py-3 px-6 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSending ? "Sending OTP..." : "Send OTP"}
            </button>
            <div id="recaptcha-container"></div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 font-bricolage">
             <div>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-green/50" />
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP" 
                  className="w-full pl-12 pr-4 py-3 bg-bright-white border border-gray-200 rounded-xl focus:outline-none focus:border-dark-green focus:ring-1 focus:ring-dark-green transition-colors text-dark-green placeholder-dark-green/50 text-center tracking-widest text-lg" 
                  maxLength={6}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-3 bg-dark-green text-light-beige py-3 px-6 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isVerifying ? "Verifying..." : "Verify & Continue"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
