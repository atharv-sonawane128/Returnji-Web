"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QrCode, Search, Sparkles, ShieldCheck } from "lucide-react";

function ScanLandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get("qrId") || searchParams.get("id") || "";

  const [inputQrId, setInputQrId] = useState(queryId);
  const [error, setError] = useState("");

  const handleScanSubmit = (e) => {
    e.preventDefault();
    const clean = inputQrId.trim().toUpperCase();
    if (!clean) {
      setError("Please enter or scan a valid Returnji QR Tag ID.");
      return;
    }
    router.push(`/scan/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen bg-light-beige/50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center">
        
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
          <QrCode className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Returnji Tag Scanner
        </div>

        <h1 className="text-2xl font-black text-dark-green mb-2">
          Scan Physical QR Tag
        </h1>
        <p className="text-xs text-gray-600 mb-6">
          Enter the QR code ID from your Regular Sticker, Mini Sticker, or Keychain to check status. Unregistered tags open the Claim page; active tags open the Finder page.
        </p>

        <form onSubmit={handleScanSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="e.g. RJ-ST-1001, RJ-CS-2002, RJ-KC-3003"
              value={inputQrId}
              onChange={(e) => { setInputQrId(e.target.value.toUpperCase()); setError(""); }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl font-mono text-sm text-center uppercase tracking-wider focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-6 bg-dark-green text-white font-bold rounded-xl hover:bg-dark-green/90 transition-all flex items-center justify-center gap-2 text-sm shadow-md"
          >
            <Search className="w-4 h-4" /> Open Scanned QR Code
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Automatic Database Routing Enabled</span>
        </div>

      </div>
    </div>
  );
}

export default function ScanLandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-light-beige flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ScanLandingContent />
    </Suspense>
  );
}
