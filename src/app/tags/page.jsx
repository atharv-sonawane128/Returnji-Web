"use client";

import Link from "next/link";
import { PRODUCT_CATALOG, TAG_TYPES } from "@/lib/qrProductTypes";
import { QrCode, Tag, ArrowRight, ShieldCheck, ExternalLink, Sparkles } from "lucide-react";

export default function TagsHubPage() {
  const products = [
    {
      type: TAG_TYPES.REGULAR_STICKER,
      demoId: "RJ-ST-1001",
      catalog: PRODUCT_CATALOG[TAG_TYPES.REGULAR_STICKER]
    },
    {
      type: TAG_TYPES.MINI_STICKER,
      demoId: "RJ-CS-2002",
      catalog: PRODUCT_CATALOG[TAG_TYPES.MINI_STICKER]
    },
    {
      type: TAG_TYPES.KEYCHAIN,
      demoId: "RJ-KC-3003",
      catalog: PRODUCT_CATALOG[TAG_TYPES.KEYCHAIN]
    }
  ];

  return (
    <div className="min-h-screen bg-light-beige/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Returnji Product Selector
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark-green mb-3">
            Returnji QR Physical Tags
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Select a physical tag below to test the product-aware claim registration flow or simulate a finder scanning the tag.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map(({ type, demoId, catalog }) => (
            <div 
              key={type}
              className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 flex flex-col justify-between hover:shadow-xl transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${catalog.badgeBg}`}>
                    {catalog.badge}
                  </span>
                  <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {demoId}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-dark-green mb-2">
                  {catalog.name}
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  {catalog.tagline}
                </p>

                {/* Suggestions preview */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                    {catalog.headerLabel}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {catalog.suggestions.slice(0, 5).map((sug, i) => (
                      <span key={i} className="px-2 py-1 bg-white text-gray-800 border border-gray-200 rounded-lg text-xs font-medium">
                        {sug.emoji} {sug.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <Link
                  href={`/generate?qrId=${demoId}`}
                  className="w-full py-3 bg-dark-green text-white font-bold rounded-xl text-xs hover:bg-dark-green/90 transition-all flex items-center justify-center gap-2"
                >
                  <Tag className="w-4 h-4" /> Claim Tag ({demoId})
                </Link>
                <Link
                  href={`/scan/${demoId}`}
                  className="w-full py-2.5 bg-gray-100 text-gray-800 font-semibold rounded-xl text-xs hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Test Finder Scan Flow
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
