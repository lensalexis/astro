"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

const categories = [
  { name: "Flower", slug: "flower", icon: "/images/icon-cannabis-flower.png" },
  { name: "Pre-Rolls", slug: "pre-rolls", icon: "/images/icon-cannabis-preroll.png" },
  { name: "Vaporizers", slug: "vaporizers", icon: "/images/icon-cannabis-vape.png" },
  { name: "Concentrates", slug: "concentrates", icon: "/images/icon-cannabis-concentrate.png" },
  { name: "Edibles", slug: "edibles", icon: "/images/icon-cannabis-edibles.png" },
  { name: "Beverages", slug: "beverages", icon: "/images/icon-cannabis-beverage.png" },
  { name: "Tinctures", slug: "tinctures", icon: "/images/icon-cannabis-tinctures.png" },
];

export default function ShopStep1() {
  const router = useRouter();

  const handleSelect = (slug: string) => {
    router.push(`/shop/step2?category=${slug}`);
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center px-6">
      {/* Logo fixed at top */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 md:hidden">
        <img
          src="/images/kine-buds-logo.png"
          alt="Kine Buds Dispensary"
          className="h-16 w-auto"
        />
      </div>

      <h2 className="text-2xl font-bold mb-8 mt-24">Choose Your Journey</h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => handleSelect(cat.slug)}
            className="flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white text-black font-semibold shadow hover:shadow-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <Image
              src={cat.icon}
              alt={cat.name}
              width={40}
              height={40}
              className="object-contain"
            />
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}