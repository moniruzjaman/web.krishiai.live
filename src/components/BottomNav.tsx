"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "হোম",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/tools",
    label: "টুল",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  // Center button — Analyzer
  {
    href: "/analyzer",
    label: "এনালাইজার",
    center: true,
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    href: "/learn",
    label: "শিক্ষা",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "প্রোফাইল",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex px-1 pt-2 pb-2 sticky bottom-0 z-50"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        if (item.center) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0 flex-1 no-underline"
            >
              <div
                className={`w-12 h-12 rounded-full border-[3px] border-white dark:border-gray-900 flex items-center justify-center -mt-5 ${
                  isActive
                    ? "bg-[#1b8a3e] shadow-[0_0_0_3px_#1b8a3e]"
                    : "bg-[#1b8a3e] shadow-[0_0_0_2px_#1b8a3e]"
                }`}
              >
                <span className="text-white">{item.icon}</span>
              </div>
              <span
                className={`text-[9px] font-bold mt-1 ${
                  isActive ? "text-[#1b8a3e] dark:text-green-400" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center gap-[3px] cursor-pointer no-underline"
          >
            <span
              className={`${
                isActive ? "text-[#1b8a3e] dark:text-green-400" : "text-[#9ca3af] dark:text-gray-500"
              } transition-colors duration-200`}
            >
              {item.icon}
            </span>
            <span
              className={`text-[9px] font-medium ${
                isActive
                  ? "text-[#1b8a3e] dark:text-green-400 font-bold"
                  : "text-[#9ca3af] dark:text-gray-500"
              } transition-colors duration-200`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
