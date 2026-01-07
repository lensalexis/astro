"use client";

import { createContext, useContext, useState, useEffect } from "react";

type User = {
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: any;
};

const UserContext = createContext<any>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // ✅ Load user from localStorage on first render
  useEffect(() => {
    const saved = localStorage.getItem("dispense_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse saved user", err);
      }
    }
  }, []);

  // ✅ Keep localStorage in sync when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("dispense_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("dispense_user");
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}