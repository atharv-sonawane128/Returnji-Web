"use client";

import React, { useRef } from "react";
import Image from "next/image";

export interface CircularProductItem {
  id: string | number;
  title?: string;
  name?: string;
  imageUrl?: string;
  image?: string;
  price?: string | number;
}

interface CircularProductScrollerProps {
  products: CircularProductItem[];
  selectedId?: string | number;
  onSelectProduct?: (product: any) => void;
  className?: string;
  title?: string;
}

export const CircularProductScroller: React.FC<CircularProductScrollerProps> = ({
  products,
  selectedId,
  onSelectProduct,
  className = "",
  title = "BROWSE PRODUCTS",
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) return null;

  // Default to first product if no selectedId is passed
  const activeId = selectedId !== undefined ? selectedId : products[0]?.id;

  return (
    <div className={`w-full relative select-none ${className}`}>
      {/* Dark Header Container matching reference design */}
      <div className="w-full bg-[#4a4e51] text-white pt-6 pb-12 sm:pt-8 sm:pb-16 px-4 sm:px-8 rounded-2xl sm:rounded-3xl relative shadow-xl overflow-visible">
        {title && (
          <div className="max-w-7xl mx-auto flex items-center justify-between mb-2">
            <h3 className="font-bricolage text-xs sm:text-base font-extrabold tracking-widest uppercase text-white/95">
              {title}
            </h3>
          </div>
        )}

        {/* Circular Products Row - Positioned along bottom edge so half of each circle hangs down */}
        <div className="absolute left-0 right-0 bottom-0 translate-y-1/2 z-20 px-2 sm:px-6">
          <div
            ref={scrollRef}
            className="flex items-center justify-start sm:justify-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar py-3 px-3 scroll-smooth max-w-full"
          >
            {products.map((item, idx) => {
              const itemId = item.id;
              const isSelected = activeId === itemId;
              const imgUrl = item.imageUrl || item.image || "/landing-01.png";
              const itemTitle = item.title || item.name || "Product";

              // Arc curve offset: items towards edges dip down slightly
              const count = products.length;
              const centerIdx = (count - 1) / 2;
              const distFromCenter = Math.abs(idx - centerIdx);
              const curveYOffset = distFromCenter * 3;

              return (
                <div
                  key={itemId}
                  className="flex flex-col items-center shrink-0 transition-transform duration-300"
                  style={{ transform: `translateY(${curveYOffset}px)` }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectProduct && onSelectProduct(item)}
                    aria-label={`Select ${itemTitle}`}
                    className={`group relative rounded-full overflow-hidden transition-all duration-300 cursor-pointer shrink-0 bg-stone-100 ${
                      isSelected
                        ? "w-14 h-14 sm:w-20 sm:h-20 border-4 border-white ring-4 ring-white/40 shadow-2xl z-30 scale-110 opacity-100"
                        : "w-11 h-11 sm:w-15 sm:h-15 border-2 border-white/80 shadow-lg opacity-75 hover:opacity-100 hover:scale-105 hover:border-white z-10"
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={itemTitle}
                      fill
                      sizes="(max-width: 640px) 70px, 100px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {!isSelected && (
                      <div className="absolute inset-0 bg-black/25 group-hover:bg-transparent transition-colors" />
                    )}
                  </button>

                  {/* Clean text badge label underneath */}
                  <span
                    className={`mt-1.5 font-bricolage text-[10px] sm:text-xs font-bold text-center max-w-[80px] sm:max-w-[100px] truncate transition-all ${
                      isSelected
                        ? "text-dark-green font-extrabold scale-105 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-xs"
                        : "text-stone-700 font-semibold opacity-80"
                    }`}
                  >
                    {itemTitle}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spacer for bottom half hanging down avatars */}
      <div className="h-12 sm:h-16 w-full" />
    </div>
  );
};

export default CircularProductScroller;
