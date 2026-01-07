'use client'

import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import classNames from 'classnames'

const categories = [
  'All',
  'Store Hours',
  'Ordering',
  'Payments',
  'Returns',
  'Loyalty',
  'Misc',
]

const faqs = [
  { category: 'Store Hours', q: 'What are your daily store hours?', a: 'We are open every day from 9 AM to 9 PM.' },
  { category: 'Store Hours', q: 'Are you open on holidays?', a: 'Yes, we remain open during most holidays with regular hours.' },
  { category: 'Ordering', q: 'Can I order online for pickup?', a: 'Yes, you can place an order online and pick it up in store.' },
  { category: 'Ordering', q: 'Do you offer delivery?', a: 'At the moment, we only support in-store pickup orders.' },
  { category: 'Payments', q: 'What payment methods do you accept?', a: 'We accept cash, debit cards, and select mobile wallets.' },
  { category: 'Payments', q: 'Do you accept credit cards?', a: 'Due to state regulations, we cannot accept credit cards.' },
  { category: 'Returns', q: 'Can I return a product?', a: 'No, all sales are final.' },
  { category: 'Loyalty', q: 'Do you have a loyalty program?', a: 'Yes, join our loyalty program to earn points for every purchase.' },
  { category: 'Misc', q: 'Is parking available?', a: 'Yes, we have free parking available for customers.' },
]

export default function FAQCard() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const filteredFaqs =
    activeCategory === 'All'
      ? faqs
      : faqs.filter((faq) => faq.category === activeCategory)

  return (
    <section className="">
      <div className="mx-auto max-w-6xl w-full">
        <div className="py-4">
          {/* FAQ Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 md:p-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>

            {/* Toggle buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={classNames(
                    'px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer',
                    activeCategory === cat
                      ? 'bg-black text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Questions */}
            <div className="space-y-4">
              {filteredFaqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition"
                >
                  <button
                    className="w-full flex justify-between items-center text-left"
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  >
                    <span className="font-medium text-gray-900">{faq.q}</span>
                    <ChevronDownIcon
                      className={classNames(
                        'h-5 w-5 text-gray-500 transition-transform',
                        openIndex === idx && 'rotate-180'
                      )}
                    />
                  </button>
                  {openIndex === idx && (
                    <p className="mt-3 text-gray-600 text-sm">{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}