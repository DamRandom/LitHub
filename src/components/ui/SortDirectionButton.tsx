"use client";

import { ChevronDown } from "lucide-react";

interface SortDirectionButtonProps {
  direction: "asc" | "desc";
  onToggle: () => void;
}

export default function SortDirectionButton({
  direction,
  onToggle,
}: SortDirectionButtonProps) {
  const label = direction === "asc" ? "Ascending" : "Descending";

  return (
    <div className="relative group">
      <button
        onClick={onToggle}
        aria-label={`Sort ${label}`}
        className="
          w-8 h-8
          flex items-center justify-center
          border border-gray-200 rounded-md
          bg-white/60 backdrop-blur
          shadow-sm
          transition-all
          hover:bg-white
        "
      >
        <ChevronDown
          size={14}
          className={`${
            direction === "desc" ? "rotate-180" : ""
          } transition-transform text-gray-600`}
        />
      </button>

      {/* Tooltip */}
      <div
        className="
          pointer-events-none
          absolute left-1/2 -translate-x-1/2 mt-2
          opacity-0 group-hover:opacity-100
          transition-opacity duration-150
          rounded-md
          px-2 py-1
          text-[10px] text-gray-600
          bg-white/90 backdrop-blur-sm
          border border-gray-200 shadow-sm
          whitespace-nowrap
        "
      >
        Sort {label}
      </div>
    </div>
  );
}
