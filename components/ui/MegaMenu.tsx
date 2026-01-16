"use client";

import { XMarkIcon, PhoneIcon, MapPinIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import Link from "next/link";

export default function MegaMenu({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-50 transition-transform duration-500 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-[92vw] max-w-md bg-white/90 backdrop-blur-xl shadow-lg p-6 sm:p-8 rounded-l-2xl flex flex-col">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-700 hover:text-black transition"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Wrapper to center all contents */}
        <div className="flex flex-col items-start justify-center flex-1 space-y-20">
          {/* Logo */}
          <div>
            <img
              src="/images/kine-buds-logo.png"
              alt="Kine Buds Dispensary"
              className="h-16 w-auto"
            />
          </div>

          {/* Menu Links */}
          <nav className="flex flex-col space-y-5">
            <Link
              href="/"
              className="text-xl font-semibold text-gray-900 hover:text-indigo-600 transition cursor-pointer"
            >
              Home
            </Link>
            <Link
              href="/shop"
              className="text-xl font-semibold text-gray-900 hover:text-indigo-600 transition cursor-pointer"
            >
              Shop
            </Link>
            <Link
              href="/about"
              className="text-xl font-semibold text-gray-900 hover:text-indigo-600 transition cursor-pointer"
            >
              About
            </Link>
            {/* <Link
              href="/blog"
              className="text-xl font-semibold text-gray-900 hover:text-indigo-600 transition cursor-pointer"
            >
              Blog
            </Link> */}
          </nav>

          {/* Contact Info */}
          <div className="space-y-4 w-full">
            <a
              href="tel:2019568800"
              className="flex items-center gap-2 w-full bg-black text-white px-4 py-3 rounded-full shadow hover:bg-gray-900 transition cursor-pointer"
            >
              <PhoneIcon className="h-5 w-5" />
              <span className="font-semibold">201-956-8800</span>
            </a>

            <a
              href="mailto:info@kinebudsdispensary.com"
              className="flex items-center gap-2 w-full bg-indigo-600 text-white px-4 py-3 rounded-full shadow hover:bg-indigo-500 transition cursor-pointer"
            >
              <EnvelopeIcon className="h-5 w-5" />
              <span className="font-semibold">Email Us</span>
            </a>

            <a
              href="https://www.google.com/maps/dir/?api=1&destination=113+East+Passaic+Street,+Maywood,+NJ+07607"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full bg-green-600 text-white px-4 py-3 rounded-full shadow hover:bg-green-500 transition cursor-pointer"
            >
              <MapPinIcon className="h-5 w-5" />
              <span className="font-semibold">Find Us</span>
            </a>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">
              Follow Us
            </h4>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/kinebudsnj"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition transform hover:scale-110 cursor-pointer"
              >
                <FaFacebookF className="text-lg" />
              </a>
              <a
                href="https://www.instagram.com/kinebudsdispensarynj"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-pink-500 text-white hover:bg-pink-600 transition transform hover:scale-110 cursor-pointer"
              >
                <FaInstagram className="text-lg" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}