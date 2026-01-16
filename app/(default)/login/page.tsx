"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserContext"; // ✅ import from your UserContext, not hooks

export default function LoginPage() {
  const { setUser } = useUser(); // ✅ client hook works now
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [mode, setMode] = useState<"login" | "signup">("login");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Logging in...");

    try {
      const res = await fetch("/api/dispense/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error(`Login failed (${res.status})`);

      const data = await res.json();
      console.log("Login response:", data);

      const token = data?.token;
      if (!token) throw new Error("No token in response");

      // ✅ Save token
      localStorage.setItem("dispense_token", token);

      // ✅ Save user into context + localStorage
      if (data.user) {
        setUser(data.user);
        localStorage.setItem("dispense_user", JSON.stringify(data.user));
      }

      setMessage("✅ Logged in successfully. Token + user saved.");
      router.push("/");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    setMessage("Creating account...");
    try {
      const res = await fetch("/api/dispense/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username,
          username,
          password,
          loginType: "email",
        }),
      });

      if (!res.ok) throw new Error(`Register failed (${res.status})`);

      const data = await res.json();
      const token = data?.token;
      if (token) localStorage.setItem("dispense_token", token);

      if (data.user) {
        setUser(data.user);
        localStorage.setItem("dispense_user", JSON.stringify(data.user));
      }

      setMessage("✅ Account created. Redirecting...");
      router.push("/");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  }

  async function fetchOrders() {
    const token = localStorage.getItem("dispense_token");
    if (!token) {
      setMessage("⚠️ No token found. Please login first.");
      return;
    }

    setMessage("Fetching orders...");

    try {
      const res = await fetch("/api/dispense/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch orders (${res.status})`);

      const data = await res.json();
      setOrders(data?.orders || []);
      setMessage("✅ Orders fetched!");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-white to-rose-50 text-gray-900 bg-[url('/images/store-front.jpg')] bg-cover bg-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,121,64,0.12),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(209,56,139,0.12),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(34,121,64,0.08),transparent_50%)] blur-sm opacity-25" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/8 via-white/24 to-white/10 backdrop-blur-sm" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-xl rounded-[28px] border border-white/70 bg-white/85 p-8 shadow-2xl ring-1 ring-black/5 backdrop-blur-2xl sm:p-10">
          <div className="flex flex-col items-center gap-3">
            <div className="text-center space-y-2">
              <p className="inline-flex items-center justify-center gap-2 self-center rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-lime-700 ring-1 ring-lime-200/60">
                Welcome back
              </p>
              <p className="text-gray-700">Access your account, orders, and loyalty rewards.</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-8 text-base font-semibold">
            <button
              type="button"
              className={`pb-2 ${mode === "login" ? "text-green-700 border-b-2 border-green-700" : "text-gray-500"}`}
              onClick={() => setMode("login")}
            >
              Log In
            </button>
            <button
              type="button"
              className={`pb-2 ${mode === "signup" ? "text-green-700 border-b-2 border-green-700" : "text-gray-500"}`}
              onClick={() => setMode("signup")}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800">Phone or Email</label>
        <input
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-[0_6px_14px_rgba(0,0,0,0.05)] outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                placeholder="you@example.com"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800">Password</label>
        <input
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-[0_6px_14px_rgba(0,0,0,0.05)] outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                placeholder="••••••••"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800">Confirm Password</label>
                <input
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-[0_6px_14px_rgba(0,0,0,0.05)] outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                  placeholder="Re-enter password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

        <button
          type="submit"
              className="w-full rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-200"
        >
              {mode === "login" ? "Log In" : "Sign Up"}
        </button>

            <div className="text-center text-sm text-gray-600">
              {mode === "login" ? (
                <a className="font-semibold text-purple-600 hover:underline" href="/forgot-password">
                  Forgot your password?
                </a>
              ) : (
                <span className="text-gray-600">Already have an account?{" "}
      <button
                    type="button"
                    className="font-semibold text-purple-600 hover:underline"
                    onClick={() => setMode("login")}
      >
                    Log in
      </button>
                </span>
              )}
            </div>
          </form>

          {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
        </div>
      </div>
    </div>
  );
}