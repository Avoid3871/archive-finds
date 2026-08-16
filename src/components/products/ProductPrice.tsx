"use client";

import React, { useEffect, useState } from "react";
import { useCurrency, CurrencyCode } from "@/lib/currency/CurrencyContext";

interface ProductPriceProps {
  price: number | string;
  className?: string;
  targetCurrency?: CurrencyCode;
  showDecimals?: boolean;
}

export function ProductPrice({
  price,
  className = "",
  targetCurrency,
  showDecimals = false,
}: ProductPriceProps) {
  const { formatPrice, currency } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num) || num <= 0) {
    return <span className={className}>—</span>;
  }

  // Before mounting on client, show USD as default SSR representation
  if (!mounted) {
    return <span className={className}>${Math.round(num)}</span>;
  }

  const formatted = formatPrice(num, { targetCurrency, showDecimals });

  return <span className={className}>{formatted}</span>;
}
