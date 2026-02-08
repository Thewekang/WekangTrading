"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, Plus, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface BottomNavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
}

function BottomNavItem({ href, icon: Icon, label, isActive }: BottomNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center flex-1 min-h-[44px] px-2 py-1.5 transition-colors",
        "active:bg-gray-100",
        isActive
          ? "text-blue-600"
          : "text-gray-600 hover:text-gray-900"
      )}
    >
      <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
      <span className={cn(
        "text-[10px] mt-0.5 font-medium",
        isActive && "font-semibold"
      )}>
        {label}
      </span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide/show on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show nav when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } 
      // Hide nav when scrolling down (but only after scrolling past 100px)
      else if (currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/trades/new", icon: Plus, label: "New Trade" },
    { href: "/trades", icon: TrendingUp, label: "Trades" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full",
        // iOS safe area
        "pb-safe"
      )}
      style={{
        boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="flex justify-around items-stretch h-14">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== "/dashboard" && pathname.startsWith(item.href));
          
          return (
            <BottomNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
            />
          );
        })}
      </div>
    </nav>
  );
}
