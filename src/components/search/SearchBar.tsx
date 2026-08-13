"use client";

import { Search, X } from "lucide-react";
import { ChangeEvent } from "react";

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search Archive Finds (e.g. Helmut Lang, 85 Denim, Riot)...",
  autoFocus = false,
}: SearchBarProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
        <Search className="w-5 h-5" />
      </div>

      <input
        type="text"
        value={value}
        onChange={handleChange}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full pl-12 pr-10 py-3.5 bg-neutral-50 border border-neutral-200 text-sm md:text-base text-black placeholder:text-neutral-600 focus:outline-none focus:bg-white focus:border-black transition-colors rounded-none"
      />

      {value && (
        <button
          type="button"
          onClick={onClear ? onClear : () => onChange("")}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-black transition-colors"
          aria-label="Clear search input"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
