"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/auth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = await login(email, password);

    if (result.success) {
      router.push("/products");
    } else {
      setMessage(result.message ?? "Login failed");
    }
  }

  return (
  <main className="grid min-h-screen place-items-center bg-gradient-to-br from-indigo-50 via-slate-50 to-cyan-50 p-4 sm:p-6">
  <div className="w-full max-w-md rounded-2xl border border-white/80 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Northstar Market</p>
    <h1 className="text-3xl font-bold tracking-tight text-slate-950">Welcome back</h1>
    <p className="mt-2 text-slate-600">Sign in to continue shopping.</p>

    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      <button className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-indigo-700" type="submit">
        Login
      </button>

      {message && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{message}</p>
      )}
    </form>
  </div>
  </main>
);
}
