"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface SortSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: {
    label: string;
    value: string;
  }[];
}

export default function SortSelect({ value, onChange, options }: SortSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onClick={() => setOpen((o) => !o)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {/* Trigger */}
      <div
        className="
          flex items-center justify-between
          text-xs text-gray-700
          bg-white/60 backdrop-blur
          border border-gray-200 rounded-md
          px-3 py-1.5
          shadow-sm
          cursor-pointer select-none
          transition-all
          hover:bg-white
          focus:outline-none focus:ring-2 focus:ring-gray-200
          w-32
        "
      >
        <span>{options.find((o) => o.value === value)?.label}</span>
        <ChevronDown
          size={14}
          className={`transition-transform text-gray-500 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute left-0 mt-1 w-full
            bg-white/80 backdrop-blur
            border border-gray-200 rounded-md
            shadow-lg
            overflow-hidden
            animate-fadeIn
            z-20
          "
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <div
                key={opt.value}
                className={`
                  text-xs px-3 py-2 cursor-pointer
                  transition-colors
                  ${
                    active
                      ? "bg-gray-100 text-gray-800 font-medium"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }
                `}
                onMouseDown={() => onChange(opt.value)}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
