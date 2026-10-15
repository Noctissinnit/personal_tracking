"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // penyimpanan tidak tersedia (mode privat) — abaikan
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-base transition hover:bg-stone-100 dark:border-stone-800 dark:hover:bg-stone-800"
    >
      {dark === null ? "" : dark ? "☀️" : "🌙"}
    </button>
  );
}
