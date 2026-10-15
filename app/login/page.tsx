"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"masuk" | "daftar">("masuk");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "error" | "info"; teks: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setPesan(null);
    const supabase = createClient();

    if (mode === "masuk") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setPesan({ tipe: "error", teks: error.message === "Invalid login credentials" ? "Email atau password salah." : error.message });
        setLoading(false);
        return;
      }
      router.replace("/");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setPesan({ tipe: "error", teks: error.message });
      return;
    }
    if (data.session) {
      router.replace("/");
      router.refresh();
    } else {
      setPesan({ tipe: "info", teks: "Cek email kamu untuk konfirmasi akun, lalu masuk." });
      setMode("masuk");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white shadow-lg shadow-emerald-600/20">
          16:8
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Puasa 16:8 — Anak Kos</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Checklist puasa yang ikut jadwal kuliahmu.</p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900"
      >
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 text-sm font-medium dark:bg-stone-800">
          {(["masuk", "daftar"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg py-2 capitalize transition ${
                mode === m ? "bg-white shadow-sm dark:bg-stone-700" : "text-stone-500 dark:text-stone-400"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-transparent px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-stone-700"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "masuk" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-transparent px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-stone-700"
          />
        </label>

        {pesan && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              pesan.tipe === "error"
                ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
            }`}
          >
            {pesan.teks}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Memproses…" : mode === "masuk" ? "Masuk" : "Buat akun"}
        </button>
      </form>
    </main>
  );
}
