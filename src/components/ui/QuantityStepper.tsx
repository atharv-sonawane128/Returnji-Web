"use client";

import React from "react";
import { Plus, Minus } from "lucide-react";

interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  className = "",
  size = "md",
}) => {
  const isSmall = size === "sm";

  if (quantity <= 0) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onIncrement();
        }}
        className={`bg-[#1B4D3E] hover:bg-[#143B2F] active:scale-95 text-white font-bold rounded-lg border border-[#1B4D3E] transition-all shadow-xs flex items-center justify-center cursor-pointer ${
          isSmall ? "px-3 py-1 text-xs min-w-[64px]" : "px-6 py-2.5 text-sm min-w-[96px]"
        } ${className}`}
      >
        ADD
      </button>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center justify-between bg-[#1B4D3E] text-white rounded-lg font-bold border border-[#1B4D3E] shadow-xs select-none ${
        isSmall ? "px-1.5 py-0.5 text-xs min-w-[72px]" : "px-3 py-1.5 text-sm min-w-[104px]"
      } ${className}`}
    >
      <button
        type="button"
        onClick={onDecrement}
        aria-label="Decrease quantity"
        className="p-1 hover:bg-white/20 rounded transition-colors cursor-pointer"
      >
        <Minus className={isSmall ? "w-3 h-3" : "w-4 h-4"} />
      </button>
      <span className="px-2 font-extrabold text-white">{quantity}</span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Increase quantity"
        className="p-1 hover:bg-white/20 rounded transition-colors cursor-pointer"
      >
        <Plus className={isSmall ? "w-3 h-3" : "w-4 h-4"} />
      </button>
    </div>
  );
};
