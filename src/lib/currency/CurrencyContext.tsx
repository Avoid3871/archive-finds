"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

export type CurrencyCode = "USD" | "EUR" | "USDT" | "CNY" | "GBP" | "CAD" | "AUD";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateFromUSD: number; // e.g. 1 USD = 0.92 EUR
  symbolPosition: "prefix" | "suffix";
  decimalPlaces: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    rateFromUSD: 1.0,
    symbolPosition: "prefix",
    decimalPlaces: 0,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    rateFromUSD: 0.92,
    symbolPosition: "suffix",
    decimalPlaces: 0,
  },
  USDT: {
    code: "USDT",
    symbol: "USDT",
    name: "Tether (Crypto)",
    rateFromUSD: 1.0,
    symbolPosition: "suffix",
    decimalPlaces: 0,
  },
  CNY: {
    code: "CNY",
    symbol: "¥",
    name: "Chinese Yuan (RMB)",
    rateFromUSD: 7.20,
    symbolPosition: "prefix",
    decimalPlaces: 0,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    rateFromUSD: 0.79,
    symbolPosition: "prefix",
    decimalPlaces: 0,
  },
  CAD: {
    code: "CAD",
    symbol: "CA$",
    name: "Canadian Dollar",
    rateFromUSD: 1.36,
    symbolPosition: "prefix",
    decimalPlaces: 0,
  },
  AUD: {
    code: "AUD",
    symbol: "AU$",
    name: "Australian Dollar",
    rateFromUSD: 1.52,
    symbolPosition: "prefix",
    decimalPlaces: 0,
  },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  currencyConfig: CurrencyConfig;
  setCurrency: (code: CurrencyCode) => void;
  convertPrice: (usdAmount: number | string, targetCurrency?: CurrencyCode) => number;
  formatPrice: (
    usdAmount: number | string,
    options?: {
      targetCurrency?: CurrencyCode;
      showDecimals?: boolean;
      showCode?: boolean;
    }
  ) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = "archive_finds_currency";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode;
      if (saved && CURRENCIES[saved]) {
        setCurrencyState(saved);
      }
    } catch (e) {}
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    if (!CURRENCIES[code]) return;
    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {}
  };

  const currencyConfig = useMemo(() => CURRENCIES[currency] || CURRENCIES.USD, [currency]);

  const convertPrice = (usdAmount: number | string, targetCurrency?: CurrencyCode): number => {
    const num = typeof usdAmount === "string" ? parseFloat(usdAmount) : usdAmount;
    if (isNaN(num) || num <= 0) return 0;
    const config = targetCurrency ? CURRENCIES[targetCurrency] : currencyConfig;
    return Math.round(num * config.rateFromUSD);
  };

  const formatPrice = (
    usdAmount: number | string,
    options?: {
      targetCurrency?: CurrencyCode;
      showDecimals?: boolean;
      showCode?: boolean;
    }
  ): string => {
    const num = typeof usdAmount === "string" ? parseFloat(usdAmount) : usdAmount;
    if (isNaN(num) || num <= 0) return "—";

    const config = options?.targetCurrency ? CURRENCIES[options.targetCurrency] : currencyConfig;
    const converted = Math.round(num * config.rateFromUSD);

    if (config.code === "USDT") {
      return `${converted} USDT`;
    }

    if (config.symbolPosition === "suffix") {
      return `${converted} ${config.symbol}`;
    }

    return `${config.symbol}${converted}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency: isMounted ? currency : "USD",
        currencyConfig: isMounted ? currencyConfig : CURRENCIES.USD,
        setCurrency,
        convertPrice,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      currency: "USD" as CurrencyCode,
      currencyConfig: CURRENCIES.USD,
      setCurrency: () => {},
      convertPrice: (amt: number | string) => (typeof amt === "string" ? parseFloat(amt) : amt) || 0,
      formatPrice: (amt: number | string) => {
        const num = typeof amt === "string" ? parseFloat(amt) : amt;
        return isNaN(num) ? "—" : `$${Math.round(num)}`;
      },
    };
  }
  return context;
}
