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
          text-xs font-semibold text-neutral-700
          bg-white
          border border-neutral-200/90 rounded-xl
          px-3 py-1.5
          shadow-2xs
          cursor-pointer select-none
          transition-all
          hover:bg-neutral-50 hover:border-neutral-300
          focus:outline-none focus:ring-2 focus:ring-neutral-400
          w-32
        "
      >
        <span>{options.find((o) => o.value === value)?.label}</span>
        <ChevronDown
          size={13}
          className={`transition-transform text-neutral-500 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute left-0 mt-1.5 w-full
            bg-white
            border border-neutral-200/90 rounded-xl
            shadow-lg
            overflow-hidden
            animate-fadeIn
            z-30 p-1
          "
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <div
                key={opt.value}
                className={`
                  text-xs px-2.5 py-1.5 cursor-pointer rounded-lg
                  transition-colors font-medium
                  ${
                    active
                      ? "bg-neutral-900 text-white font-semibold"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
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
