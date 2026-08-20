"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  BarChart3,
  Smartphone,
  FileSpreadsheet,
  Activity,
  Settings,
  Lock,
} from "lucide-react";

export function AdminSidebarNav({ initialProductCount = 91 }: { initialProductCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [productCount, setProductCount] = useState<number>(initialProductCount);
  const [isLocking, setIsLocking] = useState<boolean>(false);

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

  const handleLockHUD = async () => {
    if (isLocking) return;
    setIsLocking(true);
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      localStorage.removeItem("af_admin_session_active");
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/analytics", label: "Live Analytics", icon: BarChart3 },
    { href: "/admin/products", label: `Products (${productCount})`, icon: Layers },
    { href: "/admin/slides", label: "9:16 Slide Studio", icon: Smartphone },
    { href: "/admin/sources", label: "Sheet Sources", icon: FileSpreadsheet },
    { href: "/admin/jobs", label: "Job Queue", icon: Activity },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-4">
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

      {/* Quick Lock HUD Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleLockHUD}
          disabled={isLocking}
          className="w-full flex items-center gap-2 px-3 py-2 text-neutral-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 rounded text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
          title="Lock HUD & invalidate session"
        >
          <Lock className="w-3.5 h-3.5 text-neutral-500 group-hover:text-red-400" />
          <span>{isLocking ? "Locking..." : "Lock HUD"}</span>
        </button>
      </div>
    </div>
  );
}
