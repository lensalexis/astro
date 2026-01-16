"use client";

import { useState } from "react";
import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/outline"; // hamburger icon
import MegaMenu from "./MegaMenu";
import Link from "next/link";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="hidden md:block z-30 w-full">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-16 items-center justify-between">
          {/* Logo left */}
          <div className="flex items-center">
  <Link href="/">
    <img
      src="/images/kine-buds-logo.png"
      alt="Kine Buds Dispensary"
      className="h-16 w-auto cursor-pointer"
    />
  </Link>
</div>

          <div className="flex items-center gap-3">
          {/* Menu button right */}
<button
  onClick={() => setIsOpen(true)}
  className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition cursor-pointer"
>
  <Bars3Icon className="h-5 w-5" />
  <span className="font-semibold">Menu</span>
</button>
          </div>
        </div>
      </div>

      {/* Mega Menu */}
      <MegaMenu isOpen={isOpen} setIsOpen={setIsOpen} />
    </header>
  );
}