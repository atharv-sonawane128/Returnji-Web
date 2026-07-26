import React from "react";
import { Star } from "lucide-react";

interface RatingBadgeProps {
  rating?: number;
  reviewCount?: number | string;
  className?: string;
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating = 4.8,
  reviewCount = "1.2k",
  className = "",
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold shadow-xs ${className}`}
    >
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
      <span className="font-bold">{rating}</span>
      <span className="text-amber-700 text-[11px]">({reviewCount})</span>
    </div>
  );
};
