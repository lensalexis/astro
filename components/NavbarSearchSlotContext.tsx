'use client'

import { createContext, useContext, useRef, useState, type ReactNode } from 'react'

export type NavbarSearchSlotContextValue = {
  slotRef: React.RefObject<HTMLDivElement | null>
  slotReady: boolean
  setSlotReady: (ready: boolean) => void
  barInSlot: boolean
  setBarInSlot: (inSlot: boolean) => void
}

const NavbarSearchSlotContext = createContext<NavbarSearchSlotContextValue | null>(null)

export function NavbarSearchSlotProvider({ children }: { children: ReactNode }) {
  const slotRef = useRef<HTMLDivElement | null>(null)
  const [slotReady, setSlotReady] = useState(false)
  const [barInSlot, setBarInSlot] = useState(false)
  return (
    <NavbarSearchSlotContext.Provider value={{ slotRef, slotReady, setSlotReady, barInSlot, setBarInSlot }}>
      {children}
    </NavbarSearchSlotContext.Provider>
  )
}

export function useNavbarSearchSlot() {
  return useContext(NavbarSearchSlotContext)
}
