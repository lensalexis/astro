"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const sections = {
  Company: [
    "Welcome to Kine Buds, Maywood’s trusted destination for premium cannabis. We are proud to serve the community with a curated selection of high quality, lab tested cannabis products in a safe and welcoming environment.",
    "At Kine Buds, we focus on more than providing top tier products. Our team is dedicated to education, exceptional customer service, and creating a positive experience for every visitor.",
    "Whether you are exploring cannabis for wellness or recreation, our knowledgeable staff is here to guide you on your journey.",
    "Conveniently located in Maywood, New Jersey, Kine Buds is your go to dispensary for quality, community, and care."
  ],
Products: [
  "At Kine Buds, every product is carefully curated to ensure the highest quality and consistency. Our team partners with trusted cultivators and extractors to bring you safe, premium cannabis that you can rely on.",
  "🧪 Every item is lab tested for potency, cannabinoid content, and safety so you can enjoy with confidence.",
  "✅ Independent testing also ensures our products are free from pesticides, heavy metals, and harmful contaminants.",
  "From flower and pre-rolls to edibles, concentrates, and vapes, we offer a diverse menu designed to fit every preference.",
  "We are proud to carry top-tier brands including Culture Craft, 777, Seed & Strain, Authorized Dealer, Botanist, Fresh, Revelry, G-Fuse, Kind Tree, Lilly Extracts, Papa’s Herb, Ozone, and Joy Stick.",
  "When you shop at Kine Buds, you’re choosing more than cannabis — you’re choosing transparency, quality, and a better experience."
],
Careers: [
  "Kine Buds is always looking for passionate and motivated individuals who want to grow with us in the cannabis industry. We believe our team is the foundation of the welcoming and professional environment that our customers trust.",
  "Some of the positions we frequently hire for include:",
  "- Budtenders who provide expert guidance and personalized recommendations to customers.",
  "- Front Desk Associates who greet visitors, verify IDs, and create a friendly first impression.",
  "- Inventory Specialists who help manage, track, and stock products with accuracy and care.",
  "- Shift Leads and Supervisors who support team members and ensure smooth daily operations.",
  "- Community Outreach and Marketing Assistants who help us engage with the local community and promote events.",
  "If you are interested in joining our team, please send your resume and a short introduction to info@kinebudsdispensary.com. We are excited to connect with individuals who share our passion for cannabis, community, and customer care."
],
Values: [
  "At Kine Buds, our values are rooted in integrity, transparency, and responsibility. We believe that trust is earned through honesty and consistency, and we work every day to create a dispensary experience that reflects those principles.",
  "Putting our customers first is at the heart of everything we do. Whether you are new to cannabis or a long-time consumer, our team is here to listen, answer your questions, and guide you toward the products that best fit your lifestyle. Your safety, satisfaction, and confidence are always our top priorities.",
  "We are committed to transparency in both our products and our practices. From lab-tested results to clear information about sourcing and cultivation, we ensure that every customer knows exactly what they are consuming. This openness builds confidence and allows our community to shop with peace of mind.",
  "Beyond our shelves, we see ourselves as advocates for safe access and the normalization of cannabis. By promoting education and awareness, we aim to break down stigma and help more people understand the benefits of responsible cannabis use. We are proud to be part of this movement and to serve as a trusted resource in the Maywood community.",
  "Ultimately, our values come down to one simple promise: to put people before profits. Every decision we make — from the brands we carry to the way we serve our customers — is guided by our commitment to quality, care, and community."
],};

const images = [
  "/images/store-front.jpg",
  "/images/store-front1.jpg",
  "/images/tv-screen.jpg",
  "/images/product-stand.jpg",
  "/images/product-stand-2.jpg",
];

export default function AboutCard() {
  const [active, setActive] = useState<keyof typeof sections>("Company");

  // Normalize content into array of paragraphs
  const content =
    Array.isArray(sections[active]) ? sections[active] : [sections[active]];

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row">
          {/* Image/Slideshow Section */}
          <div className="relative md:w-1/2 h-64 md:h-auto">
            <Swiper
              modules={[Autoplay]}
              loop={true}
              autoplay={{ delay: 4000 }}
              className="h-full w-full"
            >
              {images.map((src, index) => (
                <SwiperSlide key={index}>
                  <Image src={src} alt="Store" fill className="object-cover" />
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Back button (mobile only) */}
            <button
              onClick={() => window.history.back()}
              className="absolute top-4 left-4 bg-white rounded-full p-2 shadow-md md:hidden z-20 cursor-pointer"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-800" />
            </button>
          </div>

          {/* Text Section */}
          <div className="p-6 md:w-1/2 flex flex-col justify-between bg-white">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                About Just a Little Higher
              </h2>

              {/* Location + Reviews row */}
              <div className="flex items-center justify-between mb-4 text-sm">
                {/* Location */}
                <span className="text-gray-600">Maywood, NJ</span>

                {/* Google summary */}
                <div className="flex items-center gap-1 text-gray-700">
                  <img
                    src="/images/google-g.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  <span className="font-semibold">4.9 ★</span>
                  <span className="text-gray-500">(298 reviews)</span>
                </div>
              </div>

              {/* Toggle buttons */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {Object.keys(sections).map((key) => (
                  <button
                    key={key}
                    onClick={() => setActive(key as keyof typeof sections)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                      active === key
                        ? "bg-black text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Active Section Content */}
              <div className="mt-6 space-y-4 text-gray-700 leading-relaxed">
  {content.map((para, i) =>
    para.startsWith("✅") || para.startsWith("🧪") || para.startsWith("🌿") || para.startsWith("💡") ? (
      <div key={i} className="bg-indigo-50 rounded-xl p-3 flex items-start gap-2">
        <span className="text-green-600">{para.slice(0, 2)}</span>
        <span>{para.slice(2)}</span>
      </div>
    ) : (
      <p key={i}>{para}</p>
    )
  )}
</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}