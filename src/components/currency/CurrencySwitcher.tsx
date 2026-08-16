"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCurrency, CURRENCIES, CurrencyCode } from "@/lib/currency/CurrencyContext";
import { ChevronDown, Check, Coins } from "lucide-react";

interface CurrencySwitcherProps {
  variant?: "header" | "footer" | "mobile";
  className?: string;
}

export function CurrencySwitcher({ variant = "header", className = "" }: CurrencySwitcherProps) {
  const { currency, setCurrency, currencyConfig } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const currencyList = Object.values(CURRENCIES);

  if (!mounted) {
    return (
      <div className={`inline-flex items-center text-xs font-mono px-2 py-1 border border-neutral-200 bg-white text-neutral-600 ${className}`}>
        <span>$ USD</span>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Currency:</span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 transition-colors"
          >
            <span className="font-bold">{currencyConfig.symbol}</span>
            <span>{currencyConfig.code}</span>
            <ChevronDown className={`w-3 h-3 text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-1.5 w-52 bg-white border border-neutral-300 shadow-lg z-50 py-1">
            <div className="px-3 py-1.5 border-b border-neutral-100 text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
              Select Currency
            </div>
            {currencyList.map((item) => {
              const active = item.code === currency;
              return (
                <button
                  key={item.code}
                  onClick={() => {
                    setCurrency(item.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-colors text-left ${
                    active ? "bg-neutral-100 text-black font-bold" : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center font-bold text-neutral-900">{item.symbol}</span>
                    <span>{item.code}</span>
                    <span className="text-[10px] text-neutral-600 font-normal truncate max-w-[85px]">{item.name}</span>
                  </div>
                  {active && <Check className="w-3.5 h-3.5 text-black shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change currency"
        className="flex items-center gap-1 px-2 py-1 text-xs font-mono uppercase tracking-wider text-neutral-700 hover:text-black border border-neutral-200 hover:border-black bg-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
      >
        <span className="font-bold text-black">{currencyConfig.symbol}</span>
        <span className="font-semibold">{currencyConfig.code}</span>
        <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-neutral-300 shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 border-b border-neutral-100 text-[10px] font-mono text-neutral-400 uppercase tracking-widest flex items-center justify-between">
            <span>Store Currency</span>
            <span className="text-[9px] text-neutral-300 font-normal">Live Auto-Convert</span>
          </div>
          {currencyList.map((item) => {
            const active = item.code === currency;
            return (
              <button
                key={item.code}
                onClick={() => {
                  setCurrency(item.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-colors text-left ${
                  active ? "bg-neutral-100 text-black font-bold" : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center font-bold text-black">{item.symbol}</span>
                  <span className="font-medium text-black">{item.code}</span>
                  <span className="text-[10px] text-neutral-600 font-light truncate max-w-[80px]">{item.name}</span>
                </div>
                {active && <Check className="w-3.5 h-3.5 text-black shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
