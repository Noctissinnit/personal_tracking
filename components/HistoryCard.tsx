"use client";

import type { RiwayatMinggu } from "./Tracker";

const fmtTgl = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

export default function HistoryCard({ rows }: { rows: RiwayatMinggu[] }) {
  const rata = rows.length ? rows.reduce((a, r) => a + Number(r.percentage ?? 0), 0) / rows.length : 0;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">Riwayat mingguan</h3>
        {rows.length > 0 && <span className="text-xs text-stone-500 dark:text-stone-400">rata-rata {Math.round(rata)}%</span>}
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
          Belum ada riwayat. Persentase tersimpan otomatis saat kamu menekan “Mulai minggu baru”.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => {
            const p = Math.round(Number(r.percentage ?? 0));
            return (
              <li key={r.id}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-stone-600 dark:text-stone-400">
                    {fmtTgl(r.started_at)} – {r.ended_at ? fmtTgl(r.ended_at) : "…"}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {p}%{" "}
                    <span className="font-normal text-stone-400">
                      ({r.done_count}/{r.total_count})
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                  <div
                    className={`h-full rounded-full ${p >= 80 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
