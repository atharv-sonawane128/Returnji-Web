import React from "react";
import Image from "next/image";
import { ShoppingCart, Star } from "lucide-react";
import { Badge, BadgeColor } from "@/components/ui/Badge";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
export interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  badge?: string;
  badgeColor?: BadgeColor;
  ctaLabel?: string;
}

export interface ProductDetail extends Product {
  images: string[];
  mrp?: number;
  weight?: string;
  unitPrice?: string;
  brand?: string;
  rating?: number;
  reviewCount?: string | number;
  deliveryTime?: string;
  paymentOffers?: { label: string; description: string }[];
}

interface ProductCardThumbnailProps {
  product: ProductDetail;
  onSelect: (product: ProductDetail) => void;
  onPreOrder: (product: ProductDetail) => void;
  onAddToCart: (product: ProductDetail) => void;
  cartQuantity: number;
  onUpdateQuantity: (id: string, newQty: number) => void;
}

/**
 * Simplified storefront ProductCard thumbnail used in shop grids.
 * Tapping anywhere opens the ProductDetailSheet.
 */
export const ProductCardThumbnail: React.FC<ProductCardThumbnailProps> = ({
  product,
  onSelect,
  onPreOrder,
  onAddToCart,
  cartQuantity,
  onUpdateQuantity,
}) => {
  const { id, title, price, mrp, imageUrl, badge, badgeColor = "gray" } = product;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-3xl border border-stone-200/60 p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer relative"
    >
      {/* Top Image */}
      <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-[#F4F1EA] mb-3">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <Badge text={badge} color={badgeColor} className="text-[11px] font-bold px-2.5 py-1" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-base text-[#1E302B] line-clamp-1 flex-1" title={title}>
            {title}
          </h3>
          <span className="font-bold text-base text-[#1E302B] whitespace-nowrap">
            ₹{price.toFixed(2)}
          </span>
        </div>

        {/* Rating Badge */}
        {product.rating && product.rating > 0 ? (
          <div className="flex items-center gap-1 bg-[#F4F1EA] w-fit px-2 py-0.5 rounded-md text-[11px] font-bold text-[#1E302B]">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
            <span className="text-stone-400 font-normal">({product.reviewCount || 1})</span>
          </div>
        ) : null}

        <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed min-h-[3rem]">
          {product.description}
        </p>

        {/* Action Row */}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <button
            type="button"
            disabled={product.ctaLabel === "Coming Soon"}
            onClick={(e) => {
              e.stopPropagation();
              if (product.ctaLabel !== "Coming Soon") {
                onPreOrder(product);
              }
            }}
            className={`flex-1 font-bold text-xs py-2.5 px-4 rounded-full transition-colors shadow-2xs ${
              product.ctaLabel === "Coming Soon"
                ? "bg-stone-200 text-stone-500 cursor-not-allowed border border-stone-300/40"
                : "bg-[#3A5343] hover:bg-[#2C4133] active:bg-[#1E302B] text-[#FDFBF7] cursor-pointer"
            }`}
          >
            {product.ctaLabel || "Order Now"}
          </button>

          {product.ctaLabel !== "Coming Soon" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              aria-label="Add to cart"
              className="w-9 h-9 rounded-xl bg-[#F0EBE1] hover:bg-[#E4DDCF] active:bg-[#DFC7B6]/40 text-[#1E302B] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-[#1E302B]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
