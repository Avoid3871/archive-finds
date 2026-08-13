"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Sparkles, Layers, Tag, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: Compass },
    { label: "Discover", href: "/discover", icon: Sparkles },
    { label: "Search", href: "/search", icon: Search },
    { label: "Brands", href: "/brands", icon: Tag },
    { label: "Categories", href: "/categories", icon: Layers },
  ];

  // Do not render bottom nav on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-neutral-200 px-3 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 min-w-[56px] text-[10px] font-semibold tracking-wider uppercase transition-all duration-200 active:scale-95",
                isActive
                  ? "text-black"
                  : "text-neutral-400 hover:text-neutral-700"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 mb-1 transition-transform",
                  isActive ? "stroke-[2.25] scale-110" : "stroke-[1.75]"
                )}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-black mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
