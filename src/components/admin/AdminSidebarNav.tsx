"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Smartphone,
  FileSpreadsheet,
  Activity,
  Settings,
} from "lucide-react";

export function AdminSidebarNav({ initialProductCount = 91 }: { initialProductCount?: number }) {
  const pathname = usePathname();
  const [productCount, setProductCount] = useState<number>(initialProductCount);

  // Sync count on mount and periodically or on window focus
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/admin/products");
        const data = await res.json();
        if (data.success && typeof data.count === "number") {
          setProductCount(data.count);
        }
      } catch (e) {
        // Fallback silently
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 5000);
    window.addEventListener("focus", fetchCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchCount);
    };
  }, []);

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/products", label: `Products (${productCount})`, icon: Layers },
    { href: "/admin/slides", label: "9:16 Slide Studio", icon: Smartphone },
    { href: "/admin/sources", label: "Sheet Sources", icon: FileSpreadsheet },
    { href: "/admin/jobs", label: "Job Queue", icon: Activity },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="space-y-1 text-xs font-mono uppercase tracking-wider">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded transition-colors ${
              isActive
                ? "bg-white text-black font-bold"
                : "text-neutral-300 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
