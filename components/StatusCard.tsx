"use client";

import { fmtJam } from "@/lib/data";
import { fmtDurasi, statusSekarang, type Settings } from "@/lib/fasting";

export default function StatusCard({ now, settings }: { now: Date | null; settings: Settings }) {
  if (!now) {
    return <div className="h-48 animate-pulse rounded-3xl bg-stone-200 dark:bg-stone-800" />;
  }

  const s = statusSekarang(now, settings);
  const total = s.berikutnya.getTime() - s.sejak.getTime();
  const jalan = now.getTime() - s.sejak.getTime();
  const persen = Math.min(100, Math.max(0, (jalan / total) * 100));
  const jamBerikutnya = s.berikutnya.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <section
      className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-lg ${
        s.sedangPuasa
          ? "bg-gradient-to-br from-indigo-600 to-violet-700 shadow-indigo-600/20"
          : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-600/20"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white/80">Status sekarang</p>
          <h2 className="mt-1 text-2xl font-bold">{s.sedangPuasa ? "Sedang puasa" : "Jendela makan terbuka"}</h2>
          <p className="mt-1 text-sm text-white/80">
            Pola {s.jendela.pola} · makan {fmtJam(s.jendela.mulai)}–{fmtJam(s.jendela.selesai)}
            {s.jendela.flex && " (Kamis fleksibel)"}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
          {s.sedangPuasa ? "🌙 Puasa" : "🍽️ Makan"}
        </span>
      </div>

      <div className="mt-6">
        <p className="text-sm text-white/80">
          {s.sedangPuasa ? "Jendela makan buka" : "Jendela makan tutup"} pukul {jamBerikutnya.replace(":", ".")} dalam
        </p>
        <p className="font-mono text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
          {fmtDurasi(s.berikutnya.getTime() - now.getTime())}
        </p>
      </div>

      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white transition-[width] duration-1000" style={{ width: `${persen}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-white/70">
          {s.sedangPuasa ? "Sudah puasa" : "Jendela berjalan"} {fmtDurasi(jalan).slice(0, 5).replace(":", " jam ")} menit
        </p>
      </div>
    </section>
  );
}
