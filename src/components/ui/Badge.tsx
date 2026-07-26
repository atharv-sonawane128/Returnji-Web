import React from "react";

export type BadgeColor = "mint" | "gray" | "green" | "amber" | "none";

interface BadgeProps {
  text: string;
  color?: BadgeColor;
  className?: string;
}

const colorVariantClasses: Record<BadgeColor, string> = {
  mint: "bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]",
  gray: "bg-stone-100 text-stone-700 border border-stone-200",
  green: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  amber: "bg-amber-50 text-amber-900 border border-amber-200",
  none: "hidden",
};

export const Badge: React.FC<BadgeProps> = ({
  text,
  color = "gray",
  className = "",
}) => {
  if (!text || color === "none") return null;

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider rounded-full shadow-xs backdrop-blur-xs ${colorVariantClasses[color]} ${className}`}
    >
      {text}
    </span>
  );
};
