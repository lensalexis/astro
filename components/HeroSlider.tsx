'use client'

import React, { useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'
import 'swiper/css'

const SLIDE_DELAY = 5000 // ms

const slides = [
  {
    src: '/images/deal-slider-2.jpg',
    title: 'UP TO 30% OFF',
    desc: 'CULTURE CRAFT CANNABIS',
  },
  {
    src: '/images/deal-slider-3.jpg',
    title: 'UP TO 30% OFF',
    desc: 'SEED & STRAIN',
  },
  {
    src: '/images/deal-slider-4.jpg',
    title: 'UP TO 30% OFF',
    desc: 'BOTANIST',
  },
  {
    src: '/images/deal-slider-5.jpg',
    title: 'UP TO 20% OFF',
    desc: 'LILLY EXTRACTS',
  },
  {
    src: '/images/deal-slider-1.jpg',
    title: 'UP TO 30% OFF',
    desc: '777 - TRIPLE SEVEN',
  },
]

export default function HeroSlider() {
  const [progress, setProgress] = useState(0)

  return (
    <div className="">
      <Swiper
        modules={[Autoplay]}
        loop={true}
        autoplay={{ delay: SLIDE_DELAY, disableOnInteraction: false }}
        onAutoplayTimeLeft={(_, time, progress) => {
          setProgress((1 - progress) * 100) // ✅ Swiper gives progress 0→1
        }}
        className="rounded-xl overflow-hidden max-w-6xl mx-auto relative cursor-pointer"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="relative">
              {/* Background Image */}
              <img src={slide.src} alt={slide.title} className="w-full" />

              {/* ✅ Buy Now Button Top Right */}
              {/* <button className="absolute top-4 right-4 bg-white text-black rounded-full px-4 py-2 flex items-center gap-2 shadow-md hover:bg-gray-100">
                <ShoppingCartIcon className="h-5 w-5" />
                Buy now
              </button> */}

              {/* ✅ Gradient Overlay + Text */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-6 text-center">
                <h3 className="text-white text-xl sm:text-3xl font-bold">
                  {slide.title}
                </h3>
                <p className="text-gray-200 text-sm sm:text-lg mt-1">
                  {slide.desc}
                </p>
              </div>

              {/* ✅ Real-time White Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                <div
                  className="h-full bg-white"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}