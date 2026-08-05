"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getQRProductInfo, PRODUCT_CATALOG } from "@/lib/qrProductTypes";
import { 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Tag, 
  Award, 
  ArrowRight, 
  Search, 
  Info, 
  LogIn, 
  QrCode, 
  ExternalLink,
  Layers,
  Heart,
  Smartphone,
  Gift
} from "lucide-react";
import Link from "next/link";

function GenerateClaimContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();

  const queryQrId = searchParams.get("qrId") || searchParams.get("id") || "";
  const [qrIdInput, setQrIdInput] = useState(queryQrId);
  const [activeQrId, setActiveQrId] = useState(queryQrId);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingData, setExistingData] = useState(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  // Product classification info
  const [productInfo, setProductInfo] = useState(getQRProductInfo(queryQrId, null));

  // Form State
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [reward, setReward] = useState("250");
  const [customReward, setCustomReward] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [formError, setFormError] = useState("");
  const [claimedSuccess, setClaimedSuccess] = useState(false);

  // Auth Form State (for logged out users)
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'signup'
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Sync active QR ID from search params
  useEffect(() => {
    if (queryQrId) {
      setActiveQrId(queryQrId);
      setQrIdInput(queryQrId);
    }
  }, [queryQrId]);

  // Fetch QR document on QR ID change
  useEffect(() => {
    async function fetchQRDoc() {
      if (!activeQrId.trim()) {
        setLoading(false);
        const info = getQRProductInfo("", null);
        setProductInfo(info);
        if (info.categories && info.categories.length > 0) {
          setCategory(info.categories[0]);
        }
        return;
      }

      setLoading(true);
      setFormError("");
      try {
        const docRef = doc(db, "qrcodes", activeQrId.trim());
        const snap = await getDoc(docRef);
        
        let data = null;
        if (snap.exists()) {
          data = snap.data();
          setExistingData(data);
          if (data.status === "active" && data.ownerId && (!user || data.ownerId !== user.uid)) {
            setAlreadyRegistered(true);
          } else {
            setAlreadyRegistered(false);
          }

          if (data.itemName) setItemName(data.itemName);
          if (data.category) setCategory(data.category);
          if (data.reward) setReward(String(data.reward));
        } else {
          setExistingData(null);
          setAlreadyRegistered(false);
        }

        const info = getQRProductInfo(activeQrId.trim(), data);
        setProductInfo(info);
        if (!data?.category && info.categories && info.categories.length > 0) {
          setCategory(info.categories[0]);
        }

      } catch (err) {
        console.error("Error loading QR tag:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchQRDoc();
  }, [activeQrId, user]);

  // Handle Suggestion Chip click
  const handleSuggestionSelect = (suggestion) => {
    setItemName(suggestion.emoji ? `${suggestion.emoji} ${suggestion.name}` : suggestion.name);
    if (suggestion.defaultCategory) {
      setCategory(suggestion.defaultCategory);
    }
  };

  // Handle Form Submit
  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!activeQrId.trim()) {
      setFormError("Please provide a valid QR ID.");
      return;
    }
    if (!itemName.trim()) {
      setFormError("Please enter your item or asset name.");
      return;
    }
    if (!user) {
      setFormError("Please sign in or create an account to claim your QR tag.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const finalReward = reward === "custom" ? Number(customReward || 0) : Number(reward || 0);
      const tagRef = doc(db, "qrcodes", activeQrId.trim());

      const payload = {
        qrId: activeQrId.trim(),
        ownerId: user.uid,
        ownerName: user.displayName || user.name || "Returnji User",
        ownerEmail: user.email || "",
        ownerPhone: user.phoneNumber || "",
        itemName: itemName.trim(),
        category: category || productInfo.categories[0],
        reward: finalReward,
        contactNote: contactNote.trim(),
        type: productInfo.id,
        productName: productInfo.name,
        status: "active",
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await setDoc(tagRef, { ...payload, registeredAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
      } catch (firestoreErr) {
        console.warn("Firestore setDoc permission notice (saving to local storage):", firestoreErr?.message);
      }

      // Save to localStorage as backup
      try {
        const saved = JSON.parse(localStorage.getItem("returnji_user_tags") || "[]");
        const filtered = saved.filter((t) => t.qrId !== activeQrId.trim() && t.id !== activeQrId.trim());
        localStorage.setItem("returnji_user_tags", JSON.stringify([payload, ...filtered]));
      } catch (e) {}

      setClaimedSuccess(true);
    } catch (err) {
      console.error("Error claiming QR code:", err);
      setFormError(err.message || "Failed to claim QR tag. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Auth Handler for guest user claiming
  const handleInlineAuth = async (type) => {
    setAuthError("");
    setAuthLoading(true);
    try {
      if (type === "google") {
        await loginWithGoogle();
      } else if (authMode === "login") {
        if (!authEmail || !authPassword) {
          throw new Error("Please enter email and password.");
        }
        await loginWithEmail(authEmail, authPassword);
      } else {
        if (!authEmail || !authPassword || !authName) {
          throw new Error("Please enter name, email, and password.");
        }
        await signupWithEmail(authEmail, authPassword, authName, authPhone);
      }
    } catch (err) {
      setAuthError(err.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const currentRewardDisplay = reward === "custom" ? customReward : reward;

  return (
    <div className="min-h-screen bg-light-beige/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        {/* QR ID Search / Header Bar if no QR ID specified */}
        {!queryQrId && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-900/10 mb-8">
            <h2 className="text-xl font-bold text-dark-green mb-2 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              Enter Returnji Physical Tag ID
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter the QR tag ID printed on your Regular Sticker (RJ-ST-...), Mini Sticker (RJ-CS-...), or Keychain (RJ-KC-...)
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. RJ-CS-9821 or RJ-KC-104"
                value={qrIdInput}
                onChange={(e) => setQrIdInput(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                onClick={() => setActiveQrId(qrIdInput)}
                className="px-6 py-3 bg-dark-green text-white font-semibold rounded-xl hover:bg-dark-green/90 transition-all flex items-center gap-2"
              >
                <Search className="w-4 h-4" /> Load Tag
              </button>
            </div>

            {/* Quick Demo Fill Buttons */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span>Try Demo IDs:</span>
              <button
                onClick={() => { setQrIdInput("RJ-ST-1001"); setActiveQrId("RJ-ST-1001"); }}
                className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg hover:bg-emerald-100 font-mono font-medium"
              >
                🏷️ RJ-ST-1001 (Regular)
              </button>
              <button
                onClick={() => { setQrIdInput("RJ-CS-2002"); setActiveQrId("RJ-CS-2002"); }}
                className="px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-lg hover:bg-indigo-100 font-mono font-medium"
              >
                🏷️ RJ-CS-2002 (Mini)
              </button>
              <button
                onClick={() => { setQrIdInput("RJ-KC-3003"); setActiveQrId("RJ-KC-3003"); }}
                className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg hover:bg-amber-100 font-mono font-medium"
              >
                🔑 RJ-KC-3003 (Keychain)
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-md border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Detecting Returnji Physical Tag Details...</p>
          </div>
        ) : claimedSuccess ? (
          /* SUCCESS STATE */
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-emerald-500/20 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-3">
              Tag Successfully Protected
            </span>

            <h1 className="text-3xl font-extrabold text-dark-green mb-2">
              Your Returnji Tag is Live! 🎉
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-sm sm:text-base">
              Tag <span className="font-mono font-bold text-emerald-800">{activeQrId}</span> has been linked to your account to protect your <strong className="text-gray-900">{itemName}</strong>.
            </p>

            {/* Tag Preview Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-6 mb-8 text-left border border-emerald-200/60 max-w-md mx-auto shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${productInfo.badgeBg}`}>
                  {productInfo.badge}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200">
                  Status: Active
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Asset / Item Name</div>
                  <div className="text-lg font-bold text-gray-900">{itemName}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-100 text-xs">
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <div className="font-semibold text-gray-800">{category}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Finder Reward:</span>
                    <div className="font-semibold text-emerald-700">₹{currentRewardDisplay}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/scan/${activeQrId}`}
                className="px-6 py-3.5 bg-dark-green text-white font-bold rounded-xl shadow-md hover:bg-dark-green/90 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Open Tag QR URL (/scan/{activeQrId})
              </Link>
              <Link
                href="/orders"
                className="px-6 py-3.5 bg-gray-100 text-gray-800 font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                Go to My Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* FORM CLAIM CARD */
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            
            {/* Dynamic Product Header Badge Banner */}
            <div className={`p-6 sm:p-8 bg-gradient-to-r ${productInfo.gradient} text-white relative overflow-hidden`}>
              <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
                <QrCode className="w-56 h-56 text-white" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> Physical Tag Claim
                </div>
                <h1 className="text-2xl sm:text-3xl font-black mb-1">
                  {productInfo.badge}
                </h1>
                <p className="text-white/90 text-sm max-w-lg">
                  {productInfo.tagline}
                </p>

                {activeQrId && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg font-mono text-xs text-white/90">
                    <span>TAG ID:</span>
                    <strong className="text-yellow-300 font-extrabold">{activeQrId}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Already Registered Warning */}
            {alreadyRegistered && (
              <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-sm flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Notice:</strong> This QR tag is already active under another account. Re-claiming will transfer ownership to your account.
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitClaim} className="p-6 sm:p-8 space-y-6">

              {/* 1. Item Name Input */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  What item are you attaching this tag to? <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Enter the name of your asset (e.g. Sony WH-1000XM4, Blue Hydro Flask, Car Keys)
                </p>
                <input
                  type="text"
                  required
                  placeholder="e.g. AirPods Pro Case, MacBook Air M2, House Keys"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* 2. One-Click Suggestion Chips */}
              <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200/70">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    {productInfo.headerLabel} ({productInfo.name})
                  </span>
                  <span className="text-[11px] text-gray-400">Click to auto-fill</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {productInfo.suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionSelect(sug)}
                      className="px-3 py-2 bg-white hover:bg-emerald-50 text-gray-800 hover:text-emerald-900 border border-gray-200 hover:border-emerald-300 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <span className="text-base">{sug.emoji}</span>
                      <span>{sug.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Pre-populated Category Dropdown */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {productInfo.categories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Reward Offered to Finder */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center justify-between">
                  <span>Finder Reward (Optional)</span>
                  <span className="text-xs font-normal text-emerald-700">Increases return rate by 80%</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Set a cash reward you will pay to whoever finds & returns your item safely.
                </p>

                <div className="grid grid-cols-4 gap-2 mb-2">
                  {["0", "100", "250", "500"].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => { setReward(amt); setCustomReward(""); }}
                      className={`py-2.5 rounded-xl font-semibold text-xs sm:text-sm border transition-all ${
                        reward === amt 
                          ? "bg-dark-green text-white border-dark-green shadow-xs" 
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {amt === "0" ? "No Reward" : `₹${amt}`}
                    </button>
                  ))}
                </div>

                {/* Custom reward option */}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setReward("custom")}
                    className={`text-xs font-medium text-emerald-700 underline mb-2 ${reward === "custom" ? "font-bold" : ""}`}
                  >
                    Set Custom Reward Amount
                  </button>
                  {reward === "custom" && (
                    <input
                      type="number"
                      placeholder="Enter amount in ₹ (e.g. 1000)"
                      value={customReward}
                      onChange={(e) => setCustomReward(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* 5. Additional Note for Finder (Optional) */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  Message / Contact Instruction for Finder (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please leave at nearest Returnji dropzone or call through chat"
                  value={contactNote}
                  onChange={(e) => setContactNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Form Error Banner */}
              {formError && (
                <div className="p-3.5 bg-red-50 text-red-700 text-xs sm:text-sm rounded-xl border border-red-200">
                  {formError}
                </div>
              )}

              {/* AUTHENTICATION SECTION (IF GUEST USER) */}
              {!user ? (
                <div className="mt-8 pt-6 border-t border-gray-200 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-200/70">
                  <div className="flex items-center gap-2 mb-3">
                    <LogIn className="w-5 h-5 text-emerald-700" />
                    <h3 className="text-base font-bold text-dark-green">
                      Sign in to complete registration
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-4">
                    Your QR tag will be securely linked to your account so you receive instant lost item notifications.
                  </p>

                  {/* Google Login Single Click */}
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={() => handleInlineAuth("google")}
                    className="w-full py-3 px-4 bg-white hover:bg-gray-50 border border-gray-300 font-semibold text-gray-800 rounded-xl shadow-xs transition-all flex items-center justify-center gap-3 text-sm mb-4"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <div className="relative text-center my-3">
                    <span className="bg-emerald-50/50 px-3 text-[11px] text-gray-400 uppercase tracking-widest">
                      Or Email Sign in
                    </span>
                  </div>

                  {/* Email & Password Fields */}
                  <div className="space-y-2 mb-3">
                    {authMode === "signup" && (
                      <input
                        type="text"
                        placeholder="Your Full Name"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none"
                      />
                    )}
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none"
                    />
                  </div>

                  {authError && (
                    <p className="text-xs text-red-600 mb-3">{authError}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleInlineAuth("email")}
                      disabled={authLoading}
                      className="px-5 py-2.5 bg-dark-green text-white font-semibold rounded-xl text-xs hover:bg-dark-green/90 transition-all"
                    >
                      {authLoading ? "Processing..." : authMode === "login" ? "Sign In & Claim" : "Sign Up & Claim"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                      className="text-xs font-semibold text-emerald-800 underline"
                    >
                      {authMode === "login" ? "Need an account? Sign Up" : "Already have an account? Log In"}
                    </button>
                  </div>
                </div>
              ) : (
                /* LOGGED IN USER SUMMARY */
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Claiming as:</div>
                      <div className="text-sm font-bold text-dark-green">
                        {user.displayName || user.email}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-3 py-1 rounded-full border border-emerald-300">
                    Verified User
                  </span>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              {user && (
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-4 px-6 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-base ${
                    submitting 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : `bg-gradient-to-r ${productInfo.gradient} hover:opacity-95 transform active:scale-98`
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Linking Tag to Firestore...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Activate Returnji Tag Protection
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}

            </form>
          </div>
        )}

      </div>
    </div>
  );
}

export default function GenerateClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-light-beige flex items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <GenerateClaimContent />
    </Suspense>
  );
}
