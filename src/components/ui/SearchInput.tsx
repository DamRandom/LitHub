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
    <div className="relative group">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-700 transition-colors"
        size={15}
      />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="
          pl-9 pr-3 py-1.5 text-xs
          border border-gray-200 rounded-md
          bg-white/60 backdrop-blur
          focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300
          text-gray-700 placeholder-gray-400
          shadow-sm
          transition-all
          w-44
        "
      />
    </div>
  );
}
