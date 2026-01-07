import type { Coordinates } from '@/types/location'

export type Store = {
  id: string
  name: string
  addressLine1: string
  addressLine2: string
  phone?: string | null
  timezone: string
  coordinates: Coordinates
  hoursDisplay?: string
  image?: string
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
  shopUrl?: string
  detailsUrl?: string
  // Enhanced fields for assistant
  status?: 'open' | 'coming_soon'
  ocm?: string
  services?: string[]
  address?: string // Full address string
}

export const stores: Store[] = [
  {
    id: 'upper-west-side',
    name: 'JALH – Upper West Side',
    addressLine1: '157 West 72nd St',
    addressLine2: 'New York NY, 10023',
    address: '157 West 72nd St, New York, NY 10023',
    phone: '646 476 4305',
    timezone: 'America/New_York',
    coordinates: { lat: 40.778, lng: -73.9799 },
    hoursDisplay: 'Sun-Thu: 9am-10pm · Fri-Sat: 9am-11:30pm',
    image: '/images/uws-bg.png',
    status: 'open',
    ocm: 'OCM-CAURD-24-000136',
    services: ['in_store'],
    hours: {
      sunday: { open: '09:00', close: '22:00' },
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '23:30' },
      saturday: { open: '09:00', close: '23:30' },
    },
    shopUrl: '/shop',
    detailsUrl: '/stores/upper-west-side',
  },
  {
    id: 'murray-hill',
    name: 'JALH – Murray Hill',
    addressLine1: '698 2nd Ave',
    addressLine2: 'New York NY 10016',
    address: '698 2nd Ave, New York, NY 10016',
    phone: '646-596-9779',
    timezone: 'America/New_York',
    coordinates: { lat: 40.7477, lng: -73.9723 },
    hoursDisplay: 'Sun-Thu: 9am-10pm · Fri-Sat: 9am-11pm',
    image: '/images/mh-bg.jpg',
    status: 'open',
    ocm: 'OCM-CAURD-24-000156',
    services: ['in_store'],
    hours: {
      sunday: { open: '09:00', close: '22:00' },
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '23:00' },
      saturday: { open: '09:00', close: '23:00' },
    },
    shopUrl: '/shop',
    detailsUrl: '/stores/murray-hill',
  },
  {
    id: 'briarwood',
    name: 'JALH – Briarwood',
    addressLine1: '138-72 Queens Blvd',
    addressLine2: 'Briarwood NY 11435',
    address: '138-72 Queens Blvd, Briarwood, NY 11435',
    phone: '718-255-3553',
    timezone: 'America/New_York',
    coordinates: { lat: 40.7093, lng: -73.8136 },
    hoursDisplay: 'Sun-Thu: 9am-10pm · Fri-Sat: 9am-11pm',
    image: '/images/briarwood-bg.jpg',
    status: 'open',
    ocm: 'OCM-CAURD-25-000233',
    services: ['in_store'],
    hours: {
      sunday: { open: '09:00', close: '22:00' },
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '23:00' },
      saturday: { open: '09:00', close: '23:00' },
    },
    shopUrl: '/shop',
    detailsUrl: '/stores/briarwood',
  },
  {
    id: 'troy',
    name: 'JALH – Troy',
    addressLine1: '740 Hoosick Rd',
    addressLine2: 'Troy, NY 12180',
    address: '740 Hoosick Rd, Troy, NY 12180',
    phone: '518-629-9511',
    timezone: 'America/New_York',
    coordinates: { lat: 42.7498, lng: -73.6537 },
    hoursDisplay: 'Daily: 9am-9pm',
    image: '/images/troy-bg.jpg',
    status: 'open',
    ocm: 'OCM-CAURD-23-000032',
    services: ['in_store'],
    hours: {
      daily: { open: '09:00', close: '21:00' },
    },
    shopUrl: '/shop',
    detailsUrl: '/stores/troy',
  },
  {
    id: 'queens-plaza',
    name: 'JALH – Queens Plaza',
    addressLine1: '2415 Queens Plz N, Unit NR1',
    addressLine2: 'Long Island City, NY 11101',
    address: '2415 Queens Plz N, Unit NR1, Long Island City, NY 11101',
    phone: '646-476-4305',
    timezone: 'America/New_York',
    coordinates: { lat: 40.7536, lng: -73.9407 },
    hoursDisplay: 'Sun-Thu: 11am-8pm · Fri-Sat: 10:30am-11pm',
    image: '/images/queens-plaza-bg.webp',
    status: 'open',
    ocm: 'OCM-CAURD-25-000275',
    services: ['in_store'],
    hours: {
      sunday: { open: '11:00', close: '20:00' },
      monday: { open: '11:00', close: '20:00' },
      tuesday: { open: '11:00', close: '20:00' },
      wednesday: { open: '11:00', close: '20:00' },
      thursday: { open: '11:00', close: '20:00' },
      friday: { open: '10:30', close: '23:00' },
      saturday: { open: '10:30', close: '23:00' },
    },
    shopUrl: '/shop',
    detailsUrl: '/stores/queens-plaza',
  },
  {
    id: 'fishkill',
    name: 'JALH – Fishkill',
    addressLine1: '982 Main Street, Suite 5',
    addressLine2: 'Fishkill, NY 12524',
    address: '982 Main Street, Suite 5, Fishkill, NY 12524',
    phone: '845-440-3700',
    timezone: 'America/New_York',
    coordinates: { lat: 41.5264, lng: -73.8994 },
    status: 'coming_soon',
    ocm: 'OCM-RETL-25-000445',
    services: ['in_store'],
    hours: {},
    shopUrl: '/shop',
    detailsUrl: '/stores/fishkill',
  },
  {
    id: 'kew-gardens',
    name: 'JALH – Kew Gardens',
    addressLine1: '146-01 Union Turnpike',
    addressLine2: 'Flushing, NY 11367',
    address: '146-01 Union Turnpike, Flushing, NY 11367',
    phone: null,
    timezone: 'America/New_York',
    coordinates: { lat: 40.7144, lng: -73.8311 },
    status: 'coming_soon',
    ocm: 'OCM-CAURD-25-000319',
    services: ['in_store'],
    hours: {},
    shopUrl: '/shop',
    detailsUrl: '/stores/kew-gardens',
  },
]

export const about = {
  tagline: "Your Destination for Recreational Cannabis in New York",
  summary: "Just a Little Higher offers premium products across multiple NY locations. Explore flower, edibles, vapes, and more.",
  story: "Created by two partners with a 20-year relationship in music/entertainment. Built to make ordering easy and streamlined."
}
