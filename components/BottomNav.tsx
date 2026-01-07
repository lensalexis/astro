"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon, XMarkIcon, Bars3Icon } from "@heroicons/react/24/solid";

export default function BottomNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" },
    // { href: "/blog", label: "Blog" },
  ];

  return (
    <div className="fixed bottom-6 left-6 right-6 z-50 md:hidden flex items-center">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-black text-white shadow-lg transition hover:bg-gray-900 z-50 relative cursor-pointer"
      >
        {isOpen ? <XMarkIcon className="h-7 w-7" /> : <Bars3Icon className="h-7 w-7" />}
      </button>

      {/* Expanding horizontal pill menu */}
      <div
        className={`ml-3 flex items-center rounded-full bg-white shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-w-[80%] flex-1 py-2 opacity-100" : "w-0 py-0 opacity-0"
        }`}
      >
        <ul
          className={`flex justify-evenly w-full text-sm font-semibold whitespace-nowrap transition-opacity duration-200 ${
            isOpen ? "opacity-100 delay-150" : "opacity-0"
          }`}
        >
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`px-4 py-2 rounded-full transition cursor-pointer ${
                    active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}