"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getQRProductInfo } from "@/lib/qrProductTypes";
import { 
  ShieldCheck, 
  MapPin, 
  MessageSquare, 
  Navigation, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Phone, 
  ExternalLink,
  QrCode,
  Sparkles,
  Share2,
  Clock,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

// Simulated Returnji Dropzone Locations for Finder Convenient Dropoff
const DROPZONES = [
  {
    id: 'dz-1',
    name: 'Returnji Hub - Central Metro Station',
    address: 'Gate No. 3, Concourse Level, Central Metro',
    distance: '0.4 km away',
    openHours: 'Open 24/7',
    type: 'Official Hub'
  },
  {
    id: 'dz-2',
    name: 'Starbucks Coffee - Park Street',
    address: '14 Park Street, Near Metro Pillar 112',
    distance: '1.2 km away',
    openHours: '8:00 AM - 11:00 PM',
    type: 'Partner Dropzone'
  },
  {
    id: 'dz-3',
    name: 'Shell Express Kiosk',
    address: 'Ring Road Petrol Station',
    distance: '2.5 km away',
    openHours: 'Open 24 Hours',
    type: 'Safe Kiosk'
  }
];

export default function ScanFinderPage() {
  const params = useParams();
  const router = useRouter();
  const rawQrId = params?.qrId || "";
  const qrId = decodeURIComponent(rawQrId).trim();

  const [loading, setLoading] = useState(true);
  const [tagData, setTagData] = useState(null);
  const [productInfo, setProductInfo] = useState(getQRProductInfo(qrId, null));

  // Geolocation & Notification state
  const [locationStatus, setLocationStatus] = useState("requesting"); // requesting | granted | denied
  const [coords, setCoords] = useState(null);
  const [mapsLink, setMapsLink] = useState("");
  const [notifiedOwner, setNotifiedOwner] = useState(false);
  const [quickAlertSent, setQuickAlertSent] = useState(false);

  // 1. Fetch Tag Document from Firestore
  useEffect(() => {
    async function loadTag() {
      if (!qrId) {
        setLoading(false);
        return;
      }

      try {
        const tagRef = doc(db, "qrcodes", qrId);
        const snap = await getDoc(tagRef);

        if (!snap.exists()) {
          // If uncreated/unregistered in DB, redirect to claim page
          router.replace(`/generate?qrId=${encodeURIComponent(qrId)}`);
          return;
        }

        const data = snap.data();
        setTagData(data);

        // Check registration status: If unregistered or missing owner, redirect to generate
        if (!data.status || data.status === "unregistered" || !data.ownerId) {
          router.replace(`/generate?qrId=${encodeURIComponent(qrId)}`);
          return;
        }

        // Determine product catalog info
        const info = getQRProductInfo(qrId, data);
        setProductInfo(info);

      } catch (err) {
        console.error("Error loading scanned QR code:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTag();
  }, [qrId, router]);

  // 2. Request Browser Geolocation & Log Finder Location to Owner
  useEffect(() => {
    if (!tagData || !tagData.ownerId || tagData.status !== "lost") return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

          setCoords({ latitude, longitude });
          setMapsLink(mapUrl);
          setLocationStatus("granted");

          // Save scan event in Firestore & notify owner
          try {
            await addDoc(collection(db, "scans"), {
              qrId: qrId,
              ownerId: tagData.ownerId,
              itemName: tagData.itemName || "Item",
              latitude,
              longitude,
              mapsLink: mapUrl,
              scannedAt: serverTimestamp(),
              userAgent: typeof navigator !== "undefined" ? navigator.userAgent : ""
            });

            // Add notification document for owner
            await addDoc(collection(db, "notifications"), {
              recipientId: tagData.ownerId,
              qrId: qrId,
              title: `📍 Your ${tagData.itemName || "item"} tag was scanned!`,
              message: `Someone scanned your ${tagData.itemName} tag. Location logged.`,
              mapsLink: mapUrl,
              read: false,
              createdAt: serverTimestamp()
            });

            setNotifiedOwner(true);
          } catch (e) {
            console.error("Error logging scan location:", e);
          }
        },
        (error) => {
          console.warn("Geolocation permission denied or failed:", error);
          setLocationStatus("denied");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationStatus("denied");
    }
  }, [tagData, qrId]);

  // Trigger manual quick alert button
  const handleSendQuickAlert = async () => {
    if (!tagData?.ownerId) return;
    try {
      await addDoc(collection(db, "notifications"), {
        recipientId: tagData.ownerId,
        qrId: qrId,
        title: `🚨 Finder Alert: Someone found your ${tagData.itemName || "item"}!`,
        message: `A finder scanned your Returnji tag and is waiting on the chat page.`,
        mapsLink: mapsLink || "",
        read: false,
        createdAt: serverTimestamp()
      });
      setQuickAlertSent(true);
    } catch (e) {
      console.error("Error sending quick alert:", e);
    }
  };

  const chatId = `chat_${qrId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-light-beige flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-700 font-medium">Scanning Returnji Tag Details...</p>
      </div>
    );
  }

  const isLost = tagData?.status === "lost";

  if (!isLost) {
    return (
      <div className="min-h-screen bg-light-beige/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 overflow-hidden relative text-center">
            <div className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-r ${productInfo.gradient}`} />
            
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider inline-block mb-3">
              🟢 Product is Safe with Owner
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-dark-green mb-2">
              {tagData?.itemName ? `${tagData.itemName} is Safe with Owner` : "This Item is Safe with Owner"}
            </h1>
            
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
              This Returnji QR product is registered and active. The owner has not reported this item as lost.
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 grid grid-cols-2 gap-4 text-xs mb-6 text-left">
              <div>
                <span className="text-gray-500 block uppercase tracking-wider text-[10px] font-bold">Item Name</span>
                <strong className="text-sm text-gray-900 font-bold">{tagData?.itemName}</strong>
              </div>
              <div>
                <span className="text-gray-500 block uppercase tracking-wider text-[10px] font-bold">Category</span>
                <strong className="text-sm text-gray-900 font-bold">{tagData?.category || "Personal Asset"}</strong>
              </div>
              <div>
                <span className="text-gray-500 block uppercase tracking-wider text-[10px] font-bold">Tag ID</span>
                <span className="font-mono text-emerald-800 font-bold">{qrId}</span>
              </div>
              <div>
                <span className="text-gray-500 block uppercase tracking-wider text-[10px] font-bold">Status</span>
                <span className="text-emerald-700 font-extrabold">Active (With Owner)</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 mb-6 text-left flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-950 font-bold mb-0.5">Found this item misplaced?</strong>
                If the owner misplaced this item, they can change its status to <em>"Lost"</em> from their <strong>My Products</strong> dashboard. Live chat and recovery options will then appear here.
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-dark-green text-white font-bold rounded-2xl text-sm hover:bg-dark-green/90 transition-all"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-beige/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* TOP STATUS CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 overflow-hidden relative">
          <div className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-r ${productInfo.gradient}`} />
          
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pt-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${productInfo.badgeBg} flex items-center gap-1.5`}>
              {productInfo.badge}
            </span>

            {tagData?.reward > 0 ? (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs flex items-center gap-1 animate-pulse">
                <Award className="w-4 h-4" /> Cash Reward Offered: ₹{tagData.reward}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Protected Item
              </span>
            )}
          </div>

          <h1 className="text-3xl font-black text-dark-green mb-1 flex items-center gap-2">
            You Found {tagData?.itemName || "a Lost Item"}! 🎒
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Thank you for being an honest finder! Returnji connects you directly with the owner without sharing personal numbers.
          </p>

          {/* ITEM DETAILS SUMMARY */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 grid grid-cols-2 gap-4 text-xs mb-6">
            <div>
              <span className="text-gray-500 block uppercase tracking-wider text-[10px] font-bold">Item Name</span>
              <strong className="text-sm text-gray-900 font-bold">{tagData?.itemName}</strong>
            </div>
            <div>
              <span className="text-gray-500 block uppercase tracking-wider text-[10px] font-bold">Category</span>
              <strong className="text-sm text-gray-900 font-bold">{tagData?.category || "Personal Asset"}</strong>
            </div>
            <div>
              <span className="text-gray-500 block uppercase tracking-wider text-[10px] font-bold">Tag ID</span>
              <span className="font-mono text-emerald-800 font-bold">{qrId}</span>
            </div>
            <div>
              <span className="text-gray-500 block uppercase tracking-wider text-[10px] font-bold">Owner Contact</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Anonymous Secured
              </span>
            </div>
          </div>

          {/* GEOLOCATION & NOTIFICATION STATUS BANNER */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 mb-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 flex-1">
                {locationStatus === "granted" ? (
                  <>
                    <strong className="text-emerald-900 text-sm block">Location Shared with Owner! 📍</strong>
                    GPS coordinates logged. Owner has been notified with Google Maps directions.
                    {mapsLink && (
                      <a 
                        href={mapsLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                      >
                        View Scanned Location on Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <strong className="text-emerald-900 text-sm block">Location Access Requested</strong>
                    Sharing location helps the owner locate where their item was found.
                  </>
                )}
              </div>
            </div>
          </div>

          {/* FINDER MAIN ACTIONS */}
          <div className="space-y-3">
            {/* 1. Launch Anonymous Chat */}
            <Link
              href={`/chat/${chatId}?qrId=${encodeURIComponent(qrId)}`}
              className="w-full py-4 px-6 bg-dark-green text-white font-bold rounded-2xl shadow-md hover:bg-dark-green/90 transition-all flex items-center justify-center gap-3 text-base"
            >
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              Chat Anonymously with Owner
              <ChevronRight className="w-5 h-5 text-white/70" />
            </Link>

            {/* 2. Instant Quick Notification Button */}
            <button
              onClick={handleSendQuickAlert}
              disabled={quickAlertSent}
              className={`w-full py-3.5 px-6 font-bold rounded-2xl border transition-all flex items-center justify-center gap-2 text-sm ${
                quickAlertSent 
                  ? "bg-emerald-100 text-emerald-900 border-emerald-300" 
                  : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 shadow-2xs"
              }`}
            >
              {quickAlertSent ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Alert Sent to Owner's Phone!
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Send Instant Alert ("I Found Your Item!")
                </>
              )}
            </button>
          </div>

        </div>

        {/* SAFE DROPZONE LOCATOR CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-100">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-green">
                Returnji Safe Dropzone Locator
              </h2>
              <p className="text-xs text-gray-500">
                Can't meet the owner directly? Drop the item at a verified Returnji partner hub nearby!
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {DROPZONES.map((dz) => (
              <div 
                key={dz.id}
                className="p-4 rounded-2xl border border-gray-200/90 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-gray-900">{dz.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                      {dz.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{dz.address}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <Navigation className="w-3 h-3" /> {dz.distance}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" /> {dz.openHours}
                    </span>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dz.name + " " + dz.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all flex-shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5" /> Get Directions
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* PRIVACY & HOW RETURNJI WORKS FOOTER */}
        <div className="bg-emerald-950 text-white rounded-3xl p-6 text-center shadow-lg">
          <div className="flex justify-center mb-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="font-bold text-base mb-1">Returnji Privacy Guarantee</h3>
          <p className="text-xs text-emerald-200 max-w-md mx-auto">
            Your personal phone number and identity remain 100% private. All chats and recovery coordination are handled securely through Returnji.
          </p>
        </div>

      </div>
    </div>
  );
}
