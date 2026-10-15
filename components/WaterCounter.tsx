"use client";

import { ATURAN } from "@/lib/data";

export default function WaterCounter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const target = ATURAN.targetAir;
  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900/60 dark:bg-sky-950/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">Penghitung air</p>
          <p className="text-xs text-sky-700/80 dark:text-sky-300/70">
            {value >= target ? "Target tercapai 🎉" : `${target - value} gelas lagi`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Kurangi satu gelas"
            onClick={() => onChange(Math.max(0, value - 1))}
            disabled={value === 0}
            className="h-9 w-9 rounded-full border border-sky-300 text-lg font-bold text-sky-700 transition hover:bg-sky-100 disabled:opacity-40 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-900/50"
          >
            −
          </button>
          <span className="w-12 text-center font-mono text-lg font-bold tabular-nums text-sky-900 dark:text-sky-100">
            {value}/{target}
          </span>
          <button
            type="button"
            aria-label="Tambah satu gelas"
            onClick={() => onChange(Math.min(target, value + 1))}
            disabled={value >= target}
            className="h-9 rounded-full bg-sky-600 px-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-40"
          >
            +1 gelas
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-8 gap-1.5" aria-hidden>
        {Array.from({ length: target }, (_, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            onClick={() => onChange(i + 1 === value ? i : i + 1)}
            className={`h-8 rounded-md border transition ${
              i < value
                ? "border-sky-500 bg-sky-500"
                : "border-sky-200 bg-white dark:border-sky-900 dark:bg-stone-900"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
