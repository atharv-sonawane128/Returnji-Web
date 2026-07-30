"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Drawer } from "vaul";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronDown,
  ChevronRight,
  Heart,
  Share2,
  Copy,
  Check,
  Tag,
  Star,
  Quote,
} from "lucide-react";
import { ProductDetail } from "@/components/ProductCardThumbnail";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface ProductDetailSheetProps {
  product: ProductDetail | null;
  allProducts?: ProductDetail[];
  onClose: () => void;
  onSelectProduct?: (product: ProductDetail) => void;
  cartQuantity: number;
  onUpdateQuantity: (id: string, newQty: number) => void;
}

/**
 * Clean product detail sheet component.
 */
export const ProductDetailSheet: React.FC<ProductDetailSheetProps> = ({
  product,
  allProducts = [],
  onClose,
  onSelectProduct,
  cartQuantity,
  onUpdateQuantity,
}) => {
  const isOpen = Boolean(product);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [offersExpanded, setOffersExpanded] = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  const [topReviews, setTopReviews] = useState<any[]>([]);

  // Fetch top 2 reviews for this product from Firestore
  useEffect(() => {
    if (!product?.id && !product?.title) return;
    const fetchTopReviews = async () => {
      try {
        const ratingsRef = collection(db, "ratings");
        const snapshot = await getDocs(ratingsRef);
        const fetched: any[] = [];

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const pName = (d.productName || "").toLowerCase().trim();
          const currentPTitle = (product.title || "").toLowerCase().trim();

          if (
            (d.productId && d.productId === product.id) ||
            (pName && (currentPTitle.includes(pName) || pName.includes(currentPTitle)))
          ) {
            fetched.push({
              id: docSnap.id,
              userName: d.userName || "Verified Buyer",
              rating: Number(d.rating) || 5,
              comment: d.comment || "",
              createdAt: d.createdAt,
            });
          }
        });

        // Sort by highest rating first, then newest
        fetched.sort((a, b) => b.rating - a.rating);
        setTopReviews(fetched.slice(0, 2));
      } catch (err) {
        console.warn("Error fetching product top reviews:", err);
      }
    };

    fetchTopReviews();
  }, [product?.id, product?.title]);

  // Reset carousel slide index when switching products
  useEffect(() => {
    if (emblaApi) {
      emblaApi.scrollTo(0, true);
      setSelectedIndex(0);
    }
  }, [product?.id, emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const handleFavoriteToggle = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setIsLiked(!isLiked);
  };

  const handleShare = async () => {
    if (typeof window === "undefined" || !product) return;
    const shareUrl = window.location.href;
    const shareData = {
      title: product.title,
      text: product.description,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User closed native share dialog
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopy = async () => {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl || ""];

  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : null;

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        {/* Backdrop Overlay - Full 100% Viewport Coverage */}
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto" />

        {/* Bottom Sheet Modal & Circular Switcher Stack */}
        <Drawer.Content className="fixed bottom-3 sm:bottom-6 inset-x-0 z-50 flex flex-col items-center max-h-[88vh] sm:max-w-lg sm:mx-auto outline-none pointer-events-auto px-3">
          {/* Main White Card Container */}
          <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[78vh]">
            {/* Mobile Drag Handle Indicator */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-stone-300" />
            </div>

            <Drawer.Title className="sr-only">{product.title}</Drawer.Title>

            {/* Scrollable Container (Hidden Scrollbar) */}
            <div className="overflow-y-auto no-scrollbar scrollbar-none flex-1 p-4 sm:p-6 space-y-3.5 sm:space-y-4">
              {/* Top Carousel Section */}
              <div className="space-y-3">
                <div className="relative aspect-square max-h-[300px] sm:max-h-none w-full rounded-2xl overflow-hidden bg-[#F9F6F0] shadow-xs mx-auto">
                  {/* Embla Viewport */}
                  <div className="overflow-hidden h-full w-full" ref={emblaRef}>
                    <div className="flex h-full">
                      {images.map((src, idx) => (
                        <div key={idx} className="relative flex-[0_0_100%] h-full w-full">
                          <Image
                            src={src}
                            alt={`${product.title} view ${idx + 1}`}
                            fill
                            sizes="(max-width: 640px) 100vw, 500px"
                            className="object-cover"
                            priority={idx === 0}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Favorite & Share Quick Actions Overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    <button
                      type="button"
                      onClick={handleFavoriteToggle}
                      aria-label="Save to favorites"
                      className="p-2.5 rounded-full bg-white/90 backdrop-blur-xs text-stone-700 hover:text-red-500 shadow-md transition-all active:scale-90 cursor-pointer"
                    >
                      <Heart
                        className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      aria-label="Share product"
                      className="p-2.5 rounded-full bg-white/90 backdrop-blur-xs text-stone-700 hover:text-stone-900 shadow-md transition-all active:scale-90 cursor-pointer"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Share2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Working Dot Pagination Below Image */}
                {images.length > 1 && (
                  <div className="flex justify-center items-center gap-2 py-1">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => emblaApi?.scrollTo(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${selectedIndex === idx
                          ? "w-6 bg-[#1B4D3E]"
                          : "w-2 bg-stone-300 hover:bg-stone-400"
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Badges Bar (Rating Only) */}
              <div className="flex items-center justify-end">
                <RatingBadge
                  rating={product.rating || 5}
                  reviewCount={product.reviewCount || (topReviews.length > 0 ? topReviews.length : 1)}
                />
              </div>

              {/* Product Title */}
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-stone-900 leading-snug">
                  {product.title}
                </h2>
                {product.weight && (
                  <span className="text-xs font-medium text-stone-500 block">
                    {product.weight}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {product.description}
              </p>

              {/* Detailed Pricing Breakdown */}
              <div className="bg-stone-50 rounded-xl p-3.5 space-y-1 border border-stone-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-black text-stone-900">
                    ₹{product.price.toFixed(2)}
                  </span>
                  {product.mrp && product.mrp > product.price && (
                    <span className="text-xs sm:text-sm text-stone-400 line-through">
                      MRP ₹{product.mrp.toFixed(2)}
                    </span>
                  )}
                  {discountPercent && (
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
              </div>

              {/* Top Customer Reviews Section */}
              {topReviews.length > 0 && (
                <div className="bg-[#F8F6F0] rounded-2xl p-4 border border-[#EAE5D9] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#1E302B] flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Top Customer Reviews
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium">Top Rated</span>
                  </div>

                  <div className="space-y-2.5">
                    {topReviews.map((rev) => (
                      <div key={rev.id} className="bg-white p-3 rounded-xl border border-stone-200/60 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">{rev.userName}</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        {rev.comment && (
                          <p className="text-xs text-stone-600 italic leading-relaxed">
                            "{rev.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {product.paymentOffers && product.paymentOffers.length > 0 && (
                <div className="border border-amber-200/60 rounded-xl bg-amber-50/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOffersExpanded(!offersExpanded)}
                    className="w-full p-3 flex items-center justify-between text-left font-bold text-xs text-amber-950 hover:bg-amber-100/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-700" />
                      <span>Payment & Bank Offers ({product.paymentOffers.length})</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform duration-200 ${offersExpanded ? "rotate-90" : ""
                        }`}
                    />
                  </button>

                  {offersExpanded && (
                    <div className="px-3 pb-3 space-y-2 text-xs border-t border-amber-200/40 pt-2">
                      {product.paymentOffers.map((offer, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <span className="font-bold text-amber-900">{offer.label}</span>
                          <p className="text-stone-600">{offer.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Bottom Bar Pinned to White Card */}
            <div className="bg-white border-t border-stone-100 p-3.5 sm:p-4 px-4 sm:px-5 flex items-center justify-between gap-4 z-20 shadow-xs">
              <div>
                <span className="text-xs text-stone-500 block">Total Price</span>
                <span className="text-base sm:text-lg font-black text-[#1B4D3E]">
                  ₹{product.price.toFixed(2)}
                </span>
              </div>

              {product.ctaLabel === "Coming Soon" ? (
                <button
                  type="button"
                  disabled
                  className="bg-stone-200 text-stone-600 font-bold rounded-xl px-5 py-2.5 text-sm cursor-not-allowed shadow-2xs border border-stone-300/50"
                >
                  Coming Soon
                </button>
              ) : (
                <QuantityStepper
                  quantity={cartQuantity}
                  onIncrement={() => onUpdateQuantity(product.id, cartQuantity + 1)}
                  onDecrement={() => onUpdateQuantity(product.id, Math.max(0, cartQuantity - 1))}
                />
              )}
            </div>
          </div>

          {/* Floating Circular Product Avatars attached directly BELOW white card (No background container) */}
          {allProducts.length > 0 && (
            <div className="w-full pt-3 pb-2 flex justify-center items-center select-none overflow-visible">
              <div className="flex items-center gap-2.5 sm:gap-3.5">
                {allProducts.map((p, idx) => {
                  const isCurrent = p.id === product.id;
                  const count = allProducts.length;
                  const centerIdx = (count - 1) / 2;
                  const distFromCenter = Math.abs(idx - centerIdx);
                  const arcOffset = distFromCenter * 3;

                  return (
                    <div
                      key={p.id}
                      className="flex flex-col items-center shrink-0 transition-transform duration-300"
                      style={{ transform: `translateY(${arcOffset}px)` }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onSelectProduct) {
                            onSelectProduct(p);
                          }
                        }}
                        aria-label={`Switch to ${p.title}`}
                        className={`group relative rounded-full overflow-hidden transition-all duration-300 shadow-md cursor-pointer shrink-0 bg-stone-200 ${isCurrent
                          ? "w-11 h-11 sm:w-14 sm:h-14 border-3 sm:border-4 border-white ring-2 sm:ring-4 ring-white/40 z-20 opacity-100 scale-110"
                          : "w-8 h-8 sm:w-10 sm:h-10 border-2 border-white/70 opacity-70 hover:opacity-100 hover:scale-105"
                          }`}
                      >
                        <Image
                          src={p.imageUrl}
                          alt={p.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                        {!isCurrent && (
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
