"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  debounceMs?: number;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: SearchInputProps) {
  return (
    <div className="relative group w-full sm:w-auto">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-700 transition-colors"
        size={14}
      />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="
          pl-8.5 pr-3 py-1.5 text-xs font-medium
          border border-neutral-200/90 rounded-xl
          bg-white
          focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400
          text-neutral-800 placeholder-neutral-400
          shadow-2xs
          transition-all
          w-full sm:w-44
        "
      />
    </div>
  );
}
