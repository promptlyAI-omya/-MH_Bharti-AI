"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  FileText,
  BarChart3,
  User,
} from "lucide-react";

const navItems = [
  {
    label: "होम",
    labelEn: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "सराव",
    labelEn: "Practice",
    href: "/practice",
    icon: BookOpen,
  },
  {
    label: "मॉक टेस्ट",
    labelEn: "Mock Test",
    href: "/mock-test",
    icon: FileText,
  },
  {
    label: "प्रगती",
    labelEn: "Progress",
    href: "/progress",
    icon: BarChart3,
  },
  {
    label: "प्रोफाइल",
    labelEn: "Profile",
    href: "/profile",
    icon: User,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 no-select ${
                isActive
                  ? "text-saffron scale-105"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={`transition-all duration-300 ${
                    isActive ? "drop-shadow-[0_0_8px_rgba(255,107,0,0.6)]" : ""
                  }`}
                />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-saffron rounded-full" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium transition-all duration-300 ${
                  isActive ? "text-saffron" : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
