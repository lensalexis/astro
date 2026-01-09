'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import Image from 'next/image'
import AIProductSearch from '@/components/AIProductSearch'
import FAQCard from '@/components/FAQCard'
import { stores, type Store } from '@/lib/stores'

dayjs.extend(utc)
dayjs.extend(timezone)

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const getStoreStatus = (store: Store): boolean | null => {
  const now = dayjs().tz(store.timezone)
  const currentDay = dayNames[now.day()] as keyof Store['hours']

  if (store.hours.daily) {
    const openTime = dayjs.tz(`${now.format('YYYY-MM-DD')} ${store.hours.daily.open}`, 'YYYY-MM-DD HH:mm', store.timezone)
    const closeTime = dayjs.tz(`${now.format('YYYY-MM-DD')} ${store.hours.daily.close}`, 'YYYY-MM-DD HH:mm', store.timezone)
    return now.isAfter(openTime) && now.isBefore(closeTime)
  }

  const dayHours = store.hours[currentDay]
  if (!dayHours) return null

  const openTime = dayjs.tz(`${now.format('YYYY-MM-DD')} ${dayHours.open}`, 'YYYY-MM-DD HH:mm', store.timezone)
  const closeTime = dayjs.tz(`${now.format('YYYY-MM-DD')} ${dayHours.close}`, 'YYYY-MM-DD HH:mm', store.timezone)

  return now.isAfter(openTime) && now.isBefore(closeTime)
}

export default function StoreDetailClient() {
  const params = useParams<{ storeId: string }>()
  const router = useRouter()

  const store = useMemo(() => stores.find((s) => s.id === params?.storeId), [params?.storeId])
  const status = store ? getStoreStatus(store) : null

  const handleChange = (value: string) => {
    if (!value) return
    router.push(`/stores/${value}`)
  }

  if (!store) {
    return (
      <main className="mx-auto max-w-6xl py-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-gray-100">
          <p className="text-lg font-semibold">Store not found</p>
          <p className="text-sm text-gray-300 mt-2">Please choose a location from the selector.</p>
          <div className="mt-4">
            <select
              className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-base text-white shadow-inner outline-none ring-1 ring-white/10 focus:border-lime-300 focus:ring-lime-300"
              onChange={(e) => handleChange(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>
                Select a location
              </option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {`${s.name} — ${s.addressLine1}, ${s.addressLine2}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </main>
    )
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-12">
        <div className="w-full">
          <AIProductSearch />
        </div>

        <section className="w-full">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-3xl bg-white ring-1 ring-black/5 overflow-hidden flex flex-col md:flex-row shadow-sm w-full">
              <div className="relative md:w-2/5 h-48 md:h-auto">
                <Image
                  src={store.image || '/images/store-front.jpg'}
                  alt={`${store.name} storefront`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                />
              </div>
              <div className="p-6 flex-1 flex flex-col gap-4 text-black">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-lime-600">Store details</p>
                    <h2 className="text-2xl font-bold text-gray-900">{store.name}</h2>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      status === null
                        ? 'bg-gray-100 text-gray-700'
                        : status
                          ? 'bg-green-200 text-green-900'
                          : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {status === null ? 'Checking' : status ? 'Open now' : 'Closed'}
                  </span>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-lime-600 block mb-2">
                    Switch location
                  </label>
                  <select
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-inner outline-none ring-1 ring-gray-200 focus:border-lime-400 focus:ring-lime-300"
                    value={store.id}
                    onChange={(e) => handleChange(e.target.value)}
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {`${s.name} — ${s.addressLine1}, ${s.addressLine2}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-sm text-gray-700">
                  <p>{store.addressLine1}</p>
                  <p>{store.addressLine2}</p>
                  {store.phone && <p className="mt-1">{store.phone}</p>}
                  {store.hoursDisplay && <p className="mt-1 text-gray-600">{store.hoursDisplay}</p>}
                  {status !== null && (
                    <p className="mt-2 text-sm text-gray-700">
                      {status ? 'Open now' : 'Currently closed'} • {store.hoursDisplay || 'See hours above'}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => router.push(store.detailsUrl || `/stores/${store.id}`)}
                    className="inline-flex items-center justify-center rounded-full bg-black text-white px-5 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                  >
                    Store details
                  </button>
                  <button
                    onClick={() => router.push(store.shopUrl || '/shop')}
                    className="inline-flex items-center justify-center rounded-full bg-lime-400 px-5 py-2 text-sm font-semibold text-gray-900 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
                  >
                    Shop now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full">
          <FAQCard />
        </section>
      </div>
    </>
  )
}
