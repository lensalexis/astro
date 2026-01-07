"use client";

import { useUser } from "@/components/UserContext";
import HeroSlider from '@/components/HeroSlider';
import Link from 'next/link';

export default function HeroHome() {
  const { user } = useUser();

  return (
    <section className="py-6 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:gap-6 items-start text-left md:items-center md:text-center">
          <div className="w-full max-w-4xl mt-1">
            <HeroSlider />
          </div>

          <h2 className="text-3xl sm:text-3xl md:text-4xl font-semibold">
            {user ? `Welcome, ${user.firstName}! 👋` : "Your Trusted Cannabis Dispensary in Maywood, NJ"}
          </h2>
        </div>
      </div>
    </section>
  );
}