import React from "react";
import { Zap } from "lucide-react";

interface DeliveryBadgeProps {
  time?: string;
  className?: string;
}

export const DeliveryBadge: React.FC<DeliveryBadgeProps> = ({
  time = "10 MINS",
  className = "",
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1B4D3E] text-white font-bold text-xs shadow-xs ${className}`}
    >
      <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
      <span>{time}</span>
    </div>
  );
};
