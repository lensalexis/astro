"use client";

import Link from "next/link";
import { PhoneIcon, EnvelopeIcon, MapPinIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="py-10 mt-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col items-center gap-6">
        <div className="flex justify-center">
            <img
              src="/images/kine-buds-logo.png"
              alt="Kine Buds Dispensary"
              className="h-20 w-auto"
            />
          </div>
        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/shop"
            className="flex items-center gap-2 bg-white text-black font-semibold rounded-full px-5 py-3 shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <ShoppingBagIcon className="h-5 w-5" />
            Shop Now
          </Link>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              `${site.address.streetAddress}, ${site.address.addressLocality}, ${site.address.addressRegion} ${site.address.postalCode}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white text-black font-semibold rounded-full px-5 py-3 shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <MapPinIcon className="h-5 w-5" />
            Find Us
          </a>

          <a
            href={`tel:${site.contact.phone}`}
            className="flex items-center gap-2 bg-white text-black font-semibold rounded-full px-5 py-3 shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <PhoneIcon className="h-5 w-5" />
            Call Us
          </a>

          <a
            href={`mailto:${site.contact.email}`}
            className="flex items-center gap-2 bg-white text-black font-semibold rounded-full px-5 py-3 shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <EnvelopeIcon className="h-5 w-5" />
            Email Us
          </a>
        </div>

        {/* Social icons */}
<div className="flex gap-4 mt-2">
  <a
    href="https://www.facebook.com/kinebudsnj"
    target="_blank"
    rel="noopener noreferrer"
    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1877F2] shadow-md hover:shadow-lg transition cursor-pointer"
  >
    <FaFacebookF className="text-white" />
  </a>
  <a
    href="https://www.instagram.com/kinebudsdispensarynj"
    target="_blank"
    rel="noopener noreferrer"
    className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-md hover:shadow-lg transition cursor-pointer"
  >
    <FaInstagram className="text-white" />
  </a>
</div>

        {/* Copyright */}
        <p className="text-sm text-gray-500 mt-4">
          © {new Date().getFullYear()} Kine Buds Dispensary · All Rights Reserved
        </p>
      </div>
    </footer>
  );
}