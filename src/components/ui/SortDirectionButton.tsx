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
          border border-neutral-200/90 rounded-xl
          bg-white
          shadow-2xs
          transition-all
          hover:bg-neutral-50 hover:border-neutral-300
          cursor-pointer
        "
      >
        <ChevronDown
          size={14}
          className={`${
            direction === "desc" ? "rotate-180" : ""
          } transition-transform text-neutral-600`}
        />
      </button>

      {/* Tooltip */}
      <div
        className="
          pointer-events-none
          absolute left-1/2 -translate-x-1/2 mt-2
          opacity-0 group-hover:opacity-100
          transition-opacity duration-150
          rounded-lg
          px-2.5 py-1
          text-[10px] font-semibold text-neutral-700
          bg-white
          border border-neutral-200 shadow-md
          whitespace-nowrap z-30
        "
      >
        Sort {label}
      </div>
    </div>
  );
}
