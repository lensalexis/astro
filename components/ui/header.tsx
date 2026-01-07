"use client";

import { useState } from "react";
import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/outline"; // hamburger icon
import MegaMenu from "./MegaMenu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { stores } from "@/lib/stores";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="hidden md:block z-30 w-full">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-16 items-center justify-between">
          {/* Logo left */}
          <div className="flex items-center">
  <Link href="/">
    <img
      src="/images/jalh-logo.png"
      alt="Kine Buds Logo"
      className="h-20 w-auto cursor-pointer"
    />
  </Link>
</div>

          <div className="flex items-center gap-3">
            <select
              className="rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm text-white shadow-inner outline-none ring-1 ring-white/10 focus:border-lime-300 focus:ring-lime-300"
              defaultValue=""
              onChange={(e) => {
                const value = e.target.value;
                if (value) router.push(`/stores/${value}`);
              }}
            >
              <option value="" disabled>
                Select a store
              </option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>

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