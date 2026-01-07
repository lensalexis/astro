'use client'

import Image from "next/image"
import { useEffect, useState, useRef } from "react"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

interface Store {
    id: string
    name: string
    address: string
    phone: string | null
    timezone: string
    hours: {
        sunday?: { open: string; close: string }
        monday?: { open: string; close: string }
        tuesday?: { open: string; close: string }
        wednesday?: { open: string; close: string }
        thursday?: { open: string; close: string }
        friday?: { open: string; close: string }
        saturday?: { open: string; close: string }
        daily?: { open: string; close: string }
    }
    hoursDisplay: string
    image: string
}

export default function StoreLocator() {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const [storeStatuses, setStoreStatuses] = useState<Record<string, boolean | null>>({})

    const stores: Store[] = [
        {
            id: 'upper-west-side',
            name: 'JALH – Upper West Side',
            address: '157 West 72nd St\nNew York NY, 10023',
            phone: '646 476 4305',
            timezone: 'America/New_York',
            hours: {
                sunday: { open: '09:00', close: '22:00' },
                monday: { open: '09:00', close: '22:00' },
                tuesday: { open: '09:00', close: '22:00' },
                wednesday: { open: '09:00', close: '22:00' },
                thursday: { open: '09:00', close: '22:00' },
                friday: { open: '09:00', close: '23:30' },
                saturday: { open: '09:00', close: '23:30' },
            },
            hoursDisplay: 'Sun-Thu: 9am-10pm\nFri-Sat: 9am-11:30pm',
            image: '/images/store-front.jpg',
        },
        {
            id: 'murray-hill',
            name: 'JALH – Murray Hill',
            address: '698 2nd Ave\nNew York NY 10016',
            phone: '646-596-9779',
            timezone: 'America/New_York',
            hours: {
                sunday: { open: '09:00', close: '22:00' },
                monday: { open: '09:00', close: '22:00' },
                tuesday: { open: '09:00', close: '22:00' },
                wednesday: { open: '09:00', close: '22:00' },
                thursday: { open: '09:00', close: '22:00' },
                friday: { open: '09:00', close: '23:00' },
                saturday: { open: '09:00', close: '23:00' },
            },
            hoursDisplay: 'Sunday-Thursday 9am-10pm\nFriday & Saturday 9am-11pm',
            image: '/images/store-front.jpg',
        },
        {
            id: 'briarwood',
            name: 'JALH – Briarwood',
            address: '138-72 Queens Blvd\nBriarwood NY 11435',
            phone: null,
            timezone: 'America/New_York',
            hours: {
                sunday: { open: '09:00', close: '22:00' },
                monday: { open: '09:00', close: '22:00' },
                tuesday: { open: '09:00', close: '22:00' },
                wednesday: { open: '09:00', close: '22:00' },
                thursday: { open: '09:00', close: '22:00' },
                friday: { open: '09:00', close: '23:00' },
                saturday: { open: '09:00', close: '23:00' },
            },
            hoursDisplay: 'Sunday-Thursday 9 AM-10 PM\nFriday-Saturday 9 AM-11 PM',
            image: '/images/store-front.jpg',
        },
        {
            id: 'troy',
            name: 'JALH – Troy',
            address: '740 Hoosick Rd\nTroy, NY 12180',
            phone: '518-629-9511',
            timezone: 'America/New_York',
            hours: {
                daily: { open: '09:00', close: '21:00' },
            },
            hoursDisplay: 'Open Daily: 9am – 9pm',
            image: '/images/store-front.jpg',
        },
        {
            id: 'queens-plaza',
            name: 'JALH – Queens Plaza',
            address: '2415 Queens Plz N, Unit NR1\nLong Island City, NY 11101',
            phone: null,
            timezone: 'America/New_York',
            hours: {
                sunday: { open: '11:00', close: '20:00' },
                monday: { open: '11:00', close: '20:00' },
                tuesday: { open: '11:00', close: '20:00' },
                wednesday: { open: '11:00', close: '20:00' },
                thursday: { open: '11:00', close: '20:00' },
                friday: { open: '10:30', close: '23:00' },
                saturday: { open: '10:30', close: '23:00' },
            },
            hoursDisplay: 'Sunday – Thursday: 11am-8pm\nFriday – Saturday: 10:30am-11pm',
            image: '/images/store-front.jpg',
        },
    ]

    const checkStoreStatus = (store: Store): boolean | null => {
        const now = dayjs().tz(store.timezone)
        const dayOfWeek = now.day() // 0 = Sunday, 6 = Saturday
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const currentDay = dayNames[dayOfWeek]

        // Check if store has daily hours
        if (store.hours.daily) {
            const openTime = dayjs.tz(
                `${now.format('YYYY-MM-DD')} ${store.hours.daily.open}`,
                'YYYY-MM-DD HH:mm',
                store.timezone
            )
            const closeTime = dayjs.tz(
                `${now.format('YYYY-MM-DD')} ${store.hours.daily.close}`,
                'YYYY-MM-DD HH:mm',
                store.timezone
            )
            return now.isAfter(openTime) && now.isBefore(closeTime)
        }

        // Check day-specific hours
        const dayHours = store.hours[currentDay as keyof typeof store.hours]
        if (!dayHours) return null

        const openTime = dayjs.tz(
            `${now.format('YYYY-MM-DD')} ${dayHours.open}`,
            'YYYY-MM-DD HH:mm',
            store.timezone
        )
        const closeTime = dayjs.tz(
            `${now.format('YYYY-MM-DD')} ${dayHours.close}`,
            'YYYY-MM-DD HH:mm',
            store.timezone
        )

        return now.isAfter(openTime) && now.isBefore(closeTime)
    }

    useEffect(() => {
        const statuses: Record<string, boolean | null> = {}
        stores.forEach(store => {
            statuses[store.id] = checkStoreStatus(store)
        })
        setStoreStatuses(statuses)
    }, [])

    // Hide scrollbar for webkit browsers
    useEffect(() => {
        const style = document.createElement('style')
        style.textContent = `
            .store-scroll-container::-webkit-scrollbar {
                display: none;
            }
        `
        document.head.appendChild(style)
        return () => {
            document.head.removeChild(style)
        }
    }, [])

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return
        setIsDragging(true)
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
        setScrollLeft(scrollContainerRef.current.scrollLeft)
    }

    const handleMouseLeave = () => {
        setIsDragging(false)
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current) return
        e.preventDefault()
        const x = e.pageX - scrollContainerRef.current.offsetLeft
        const walk = (x - startX) * 2
        scrollContainerRef.current.scrollLeft = scrollLeft - walk
    }

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return
        const scrollAmount = 400
        scrollContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        })
    }

    return (
        <section className="py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="relative">
                    {/* Left Arrow */}
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110"
                        aria-label="Scroll left"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-6 h-6 text-gray-700"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>

                    {/* Right Arrow */}
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110"
                        aria-label="Scroll right"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-6 h-6 text-gray-700"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>

                    {/* Scrollable Container */}
                    <div
                        ref={scrollContainerRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        className="store-scroll-container flex gap-6 overflow-x-auto pb-4 px-12 cursor-grab active:cursor-grabbing"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties & { msOverflowStyle?: string }}
                    >
                        {stores.map((store) => {
                            const isOpen = storeStatuses[store.id]
                            return (
                                <div
                                    key={store.id}
                                    className="flex-shrink-0 w-80 bg-white rounded-2xl shadow-md overflow-hidden flex flex-col"
                                >
                                    {/* Store Image */}
                                    <div className="relative w-full h-48">
                                        <Image
                                            src={store.image}
                                            alt={store.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* Store Info */}
                                    <div className="p-6 flex flex-col flex-grow">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                            {store.name}
                                        </h3>

                                        {/* Status */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span
                                                className={`h-2.5 w-2.5 rounded-full ${
                                                    isOpen === null
                                                        ? 'bg-gray-400'
                                                        : isOpen
                                                        ? 'bg-green-500'
                                                        : 'bg-red-500'
                                                }`}
                                            ></span>
                                            <span className="text-sm text-gray-600">
                                                {isOpen === null ? 'Checking...' : isOpen ? 'Open' : 'Closed'}
                                            </span>
                                        </div>

                                        {/* Address */}
                                        <p className="text-gray-600 text-sm mb-2 whitespace-pre-line">
                                            {store.address}
                                        </p>

                                        {/* Phone */}
                                        {store.phone && (
                                            <p className="text-gray-600 text-sm mb-2">
                                                {store.phone}
                                            </p>
                                        )}

                                        {/* Hours */}
                                        <p className="text-gray-500 text-sm mb-6 whitespace-pre-line">
                                            {store.hoursDisplay}
                                        </p>

                                        {/* Buttons */}
                                        <div className="flex flex-col gap-3 mt-auto">
                                            <a
                                                href="#"
                                                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-6 rounded-xl text-center transition-colors"
                                            >
                                                Shop Now
                                            </a>
                                            <a
                                                href="#"
                                                className="bg-white border-2 border-yellow-400 hover:bg-yellow-50 text-gray-900 font-semibold py-3 px-6 rounded-xl text-center transition-colors"
                                            >
                                                Store Details
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}
