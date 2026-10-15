"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ATURAN,
  HARI,
  ITEM_IDS,
  PERINGATAN,
  TIPS_WARTEG,
  checklistUntuk,
  fmtJam,
  type DayCode,
  type ItemKind,
} from "@/lib/data";
import {
  hariEfektif,
  jendelaUntuk,
  kodeHari,
  mingguProgram,
  pada,
  tahapAdaptasi,
  tanggalLokal,
  type Settings,
} from "@/lib/fasting";
import StatusCard from "./StatusCard";
import WaterCounter from "./WaterCounter";
import HistoryCard from "./HistoryCard";
import ThemeToggle from "./ThemeToggle";

export interface RiwayatMinggu {
  id: string;
  started_at: string;
  ended_at: string | null;
  done_count: number | null;
  total_count: number;
  percentage: number | string | null;
}

interface Props {
  userId: string;
  userEmail: string;
  week: { id: string; started_at: string };
  initialSettings: Settings;
  initialChecks: Record<string, boolean>;
  initialWater: Partial<Record<DayCode, number>>;
  initialHistory: RiwayatMinggu[];
}

const TOTAL_ITEM = HARI.length * ATURAN.itemPerHari;

const WARNA_JENIS: Record<ItemKind, string> = {
  puasa: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  makan: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  umum: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
};

export default function Tracker({
  userId,
  userEmail,
  week: initialWeek,
  initialSettings,
  initialChecks,
  initialWater,
  initialHistory,
}: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [week, setWeek] = useState(initialWeek);
  const [settings, setSettings] = useState(initialSettings);
  const [checks, setChecks] = useState(initialChecks);
  const [water, setWater] = useState(initialWater);
  const [history, setHistory] = useState(initialHistory);
  const [now, setNow] = useState<Date | null>(null);
  const [dipilih, setDipilih] = useState<DayCode | null>(null);
  const [konfirmasiReset, setKonfirmasiReset] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const checksRef = useRef(checks);
  checksRef.current = checks;

  // Jam berjalan + buka tab hari ini
  useEffect(() => {
    const d = new Date();
    setNow(d);
    setDipilih(kodeHari(d));
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Sinkron ulang saat tab kembali aktif (misal habis centang dari HP lain)
  const muatUlang = useCallback(async () => {
    const { data: w } = await supabase.rpc("active_week");
    if (!w) return;
    const [c, a] = await Promise.all([
      supabase.from("checklist").select("item_key, done").eq("week_id", w.id),
      supabase.from("water").select("day_code, glasses").eq("week_id", w.id),
    ]);
    if (c.error || a.error) return;
    setWeek({ id: w.id, started_at: w.started_at });
    setChecks(Object.fromEntries((c.data ?? []).map((r) => [r.item_key, r.done])));
    setWater(Object.fromEntries((a.data ?? []).map((r) => [r.day_code, r.glasses])));
  }, [supabase]);

  useEffect(() => {
    const onVis = () => document.visibilityState === "visible" && muatUlang();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [muatUlang]);

  // ---- Aksi ----

  async function setCheck(key: string, done: boolean) {
    const sebelum = checksRef.current[key] ?? false;
    setChecks((c) => ({ ...c, [key]: done }));
    const { error } = await supabase
      .from("checklist")
      .upsert({ week_id: week.id, item_key: key, done, updated_at: new Date().toISOString() });
    if (error) {
      setChecks((c) => ({ ...c, [key]: sebelum }));
      setToast("Gagal menyimpan centangan. Coba lagi.");
    }
  }

  async function setGelas(kode: DayCode, glasses: number) {
    const sebelum = water[kode] ?? 0;
    setWater((w) => ({ ...w, [kode]: glasses }));
    if (glasses >= ATURAN.targetAir && !checksRef.current[`${kode}-air`]) setCheck(`${kode}-air`, true);
    const { error } = await supabase
      .from("water")
      .upsert({ week_id: week.id, day_code: kode, glasses, updated_at: new Date().toISOString() });
    if (error) {
      setWater((w) => ({ ...w, [kode]: sebelum }));
      setToast("Gagal menyimpan jumlah air.");
    }
  }

  async function ubahSettings(patch: Partial<Settings>) {
    const sebelum = settings;
    setSettings((s) => ({ ...s, ...patch }));
    const { error } = await supabase
      .from("settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) {
      setSettings(sebelum);
      setToast("Gagal menyimpan pengaturan.");
    }
  }

  async function mulaiMingguBaru() {
    setResetLoading(true);
    const { data, error } = await supabase.rpc("start_new_week");
    if (error || !data) {
      setResetLoading(false);
      setToast("Gagal memulai minggu baru.");
      return;
    }
    const { data: h } = await supabase
      .from("weeks")
      .select("id, started_at, ended_at, done_count, total_count, percentage")
      .eq("user_id", userId)
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(12);
    setWeek({ id: data.id, started_at: data.started_at });
    setChecks({});
    setWater({});
    setHistory((h ?? []) as RiwayatMinggu[]);
    setResetLoading(false);
    setKonfirmasiReset(false);
    setToast("Minggu baru dimulai. Semangat! 💪");
  }

  async function toggleNotifikasi() {
    if (settings.notifications) return ubahSettings({ notifications: false });
    if (typeof Notification === "undefined") {
      setToast("Browser ini tidak mendukung notifikasi.");
      return;
    }
    const izin = await Notification.requestPermission();
    if (izin !== "granted") {
      setToast("Izin notifikasi ditolak di browser.");
      return;
    }
    if ("serviceWorker" in navigator) await navigator.serviceWorker.register("/sw.js").catch(() => {});
    ubahSettings({ notifications: true });
  }

  // ---- Notifikasi pengingat (berjalan selama halaman terbuka) ----
  const hariIniStr = now ? tanggalLokal(now) : null;
  useEffect(() => {
    if (!hariIniStr || !settings.notifications) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const sekarang = new Date();
    const kode = kodeHari(sekarang);
    const jendela = jendelaUntuk(kode, settings, sekarang);
    const hari = hariEfektif(HARI.find((h) => h.kode === kode)!, jendela);
    const LIMA_BELAS_MENIT = 15 * 60_000;

    const jadwal = [
      {
        at: pada(sekarang, hari.makanPertama.jam).getTime() - LIMA_BELAS_MENIT,
        title: "15 menit lagi makan pertama",
        body: hari.makanPertama.menu,
      },
      {
        at: pada(sekarang, jendela.selesai).getTime() - LIMA_BELAS_MENIT,
        title: "Jendela makan tutup 15 menit lagi",
        body: "Selesaikan makan terakhir. Setelah ini cukup air putih.",
      },
    ];

    const tampil = async (title: string, body: string) => {
      const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
      if (reg) reg.showNotification(title, { body, icon: "/icon.svg", tag: title });
      else new Notification(title, { body, icon: "/icon.svg" });
    };

    const timers = jadwal
      .filter((j) => j.at > sekarang.getTime())
      .map((j) => setTimeout(() => tampil(j.title, j.body), j.at - sekarang.getTime()));
    return () => timers.forEach(clearTimeout);
  }, [hariIniStr, settings]);

  // ---- Data turunan ----

  const kodeHariIni = now ? kodeHari(now) : null;
  const hariAktif = dipilih ?? kodeHariIni;
  const doneDi = (kode: DayCode) => ITEM_IDS.filter((id) => checks[`${kode}-${id}`]).length;
  const totalDone = HARI.reduce((a, h) => a + doneDi(h.kode), 0);
  const persenMinggu = Math.round((totalDone / TOTAL_ITEM) * 100);

  const tanggalRef = now ?? new Date(`${settings.program_start}T00:00:00`);
  const tahap = tahapAdaptasi(settings.program_start, tanggalRef);
  const mingguKe = mingguProgram(settings.program_start, tanggalRef);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
            16:8
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight">Jadwal Puasa — Anak Kos</h1>
            <p className="truncate text-xs text-stone-500 dark:text-stone-400">{userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="h-9 rounded-full border border-stone-200 px-3 text-sm font-medium transition hover:bg-stone-100 dark:border-stone-800 dark:hover:bg-stone-800"
            >
              Keluar
            </button>
          </form>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Kolom utama */}
        <div className="min-w-0 space-y-6">
          <StatusCard now={now} settings={settings} />

          {/* Tab hari */}
          <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-7 sm:px-0">
            {HARI.map((h) => {
              const n = doneDi(h.kode);
              const aktif = h.kode === hariAktif;
              const hariIni = h.kode === kodeHariIni;
              return (
                <button
                  key={h.kode}
                  type="button"
                  onClick={() => setDipilih(h.kode)}
                  className={`relative min-w-[76px] shrink-0 rounded-2xl border px-3 py-2.5 text-left transition ${
                    aktif
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
                  }`}
                >
                  {hariIni && (
                    <span
                      className={`absolute right-2 top-2 h-2 w-2 rounded-full ${aktif ? "bg-white" : "bg-emerald-500"}`}
                      title="Hari ini"
                    />
                  )}
                  <span className="block text-sm font-semibold">{h.nama.slice(0, 3)}</span>
                  <span className={`block text-xs tabular-nums ${aktif ? "text-white/80" : "text-stone-500 dark:text-stone-400"}`}>
                    {n}/{ATURAN.itemPerHari}
                  </span>
                  <span className={`mt-1.5 block h-1 overflow-hidden rounded-full ${aktif ? "bg-white/30" : "bg-stone-100 dark:bg-stone-800"}`}>
                    <span
                      className={`block h-full rounded-full ${aktif ? "bg-white" : "bg-emerald-500"}`}
                      style={{ width: `${(n / ATURAN.itemPerHari) * 100}%` }}
                    />
                  </span>
                </button>
              );
            })}
          </nav>

          {hariAktif ? (
            <PanelHari
              kode={hariAktif}
              isHariIni={hariAktif === kodeHariIni}
              settings={settings}
              tanggal={tanggalRef}
              checks={checks}
              gelas={water[hariAktif] ?? 0}
              onCheck={setCheck}
              onGelas={(v) => setGelas(hariAktif, v)}
              onKamisFlex={(v) => ubahSettings({ kamis_flex: v })}
            />
          ) : (
            <div className="h-96 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Ringkasan minggu */}
          <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">Minggu ini</h3>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                sejak {new Date(week.started_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </span>
            </div>
            <p className="mt-3 text-4xl font-bold tabular-nums">
              {persenMinggu}
              <span className="text-xl text-stone-400">%</span>
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {totalDone} dari {TOTAL_ITEM} item selesai
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${persenMinggu}%` }} />
            </div>

            {!konfirmasiReset ? (
              <button
                type="button"
                onClick={() => setKonfirmasiReset(true)}
                className="mt-4 w-full rounded-xl border border-stone-300 py-2.5 text-sm font-semibold transition hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800"
              >
                Mulai minggu baru
              </button>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  Semua centangan dan hitungan air akan direset. Persentase minggu ini ({persenMinggu}%) disimpan ke riwayat.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setKonfirmasiReset(false)}
                    disabled={resetLoading}
                    className="flex-1 rounded-lg border border-stone-300 bg-white py-2 text-sm font-medium dark:border-stone-700 dark:bg-stone-900"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={mulaiMingguBaru}
                    disabled={resetLoading}
                    className="flex-1 rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                  >
                    {resetLoading ? "Menyimpan…" : "Ya, reset"}
                  </button>
                </div>
              </div>
            )}
          </section>

          <HistoryCard rows={history} />

          {/* Pengaturan */}
          <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <h3 className="font-semibold">Pengaturan</h3>

            <div>
              <label className="text-sm font-medium" htmlFor="program-start">
                Tanggal mulai program
              </label>
              <input
                id="program-start"
                type="date"
                value={settings.program_start}
                onChange={(e) => e.target.value && ubahSettings({ program_start: e.target.value })}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-transparent px-3 py-2 text-sm dark:border-stone-700"
              />
              <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                Minggu ke-{mingguKe} · pola <b>{tahap.pola}</b> ({fmtJam(tahap.mulai)}–{fmtJam(tahap.selesai)})
              </p>
              <ol className="mt-2 space-y-1 text-xs">
                {[
                  ["Minggu 1", "12:12", "08.00–20.00"],
                  ["Minggu 2", "14:10", "10.00–20.00"],
                  ["Minggu 3 dst.", "16:8", "11.30–19.30"],
                ].map(([m, p, j]) => (
                  <li
                    key={p}
                    className={`flex justify-between rounded-lg px-2 py-1 ${
                      tahap.pola === p
                        ? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "text-stone-500 dark:text-stone-400"
                    }`}
                  >
                    <span>{m}</span>
                    <span>
                      {p} · {j}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <Toggle
              label="Pengingat notifikasi"
              desc="15 menit sebelum makan pertama dan sebelum jendela tutup (selama tab terbuka)."
              checked={settings.notifications}
              onChange={toggleNotifikasi}
            />
          </section>

          {/* Tips & peringatan */}
          <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <h3 className="font-semibold">🍛 Tips warteg</h3>
            <ul className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-300">
              {TIPS_WARTEG.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-emerald-500">•</span>
                  {t}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            <h3 className="font-semibold">⚠️ Peringatan</h3>
            <p className="mt-2">{PERINGATAN}</p>
          </section>
        </aside>
      </div>

      {toast && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-xl bg-stone-900 px-4 py-3 text-center text-sm text-white shadow-lg dark:bg-stone-100 dark:text-stone-900">
          {toast}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------

function PanelHari({
  kode,
  isHariIni,
  settings,
  tanggal,
  checks,
  gelas,
  onCheck,
  onGelas,
  onKamisFlex,
}: {
  kode: DayCode;
  isHariIni: boolean;
  settings: Settings;
  tanggal: Date;
  checks: Record<string, boolean>;
  gelas: number;
  onCheck: (key: string, done: boolean) => void;
  onGelas: (v: number) => void;
  onKamisFlex: (v: boolean) => void;
}) {
  const jendela = jendelaUntuk(kode, settings, tanggal);
  const hari = hariEfektif(HARI.find((h) => h.kode === kode)!, jendela);
  const items = checklistUntuk(hari, jendela);
  const done = items.filter((it) => checks[`${kode}-${it.id}`]).length;
  const persen = (done / items.length) * 100;
  const bisaFlex = kode === "kam" && tahapAdaptasi(settings.program_start, tanggal).pola === "16:8";

  return (
    <section className="rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <div className="border-b border-stone-200 p-5 dark:border-stone-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">
              {hari.nama}
              {isHariIni && (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 align-middle text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Hari ini
                </span>
              )}
            </h2>
            <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
              Jendela makan {fmtJam(jendela.mulai)}–{fmtJam(jendela.selesai)} · pola {jendela.pola}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">
              {done}/{items.length}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">selesai</p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${persen}%` }} />
        </div>

        {/* Kuliah */}
        <div className="mt-4">
          {hari.kuliah.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">🎉 Libur kuliah — tetap jaga jendela makan.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {hari.kuliah.map((k) => (
                <li
                  key={k.matkul}
                  className="rounded-xl bg-stone-100 px-3 py-1.5 text-xs dark:bg-stone-800"
                  title={k.ruang}
                >
                  <span className="font-semibold tabular-nums">
                    {fmtJam(k.mulai)}–{fmtJam(k.selesai)}
                  </span>{" "}
                  {k.matkul}
                  <span className="text-stone-500 dark:text-stone-400"> · {k.online ? "🖥️ Online" : k.ruang}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {hari.catatan && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            <b>Catatan:</b> {hari.catatan}
          </div>
        )}

        {bisaFlex && (
          <div className="mt-3">
            <Toggle
              label="Mode Kamis fleksibel"
              desc="Majukan jendela makan Kamis ke 10.00–18.00."
              checked={settings.kamis_flex}
              onChange={() => onKamisFlex(!settings.kamis_flex)}
            />
          </div>
        )}
      </div>

      {/* Checklist */}
      <ul className="divide-y divide-stone-100 dark:divide-stone-800">
        {items.map((it) => {
          const key = `${kode}-${it.id}`;
          const centang = !!checks[key];
          return (
            <li key={it.id}>
              <label className="flex cursor-pointer items-start gap-4 px-5 py-4 transition hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <input
                  type="checkbox"
                  checked={centang}
                  onChange={(e) => onCheck(key, e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/40 ${
                    centang ? "border-emerald-500 bg-emerald-500 text-white" : "border-stone-300 dark:border-stone-600"
                  }`}
                >
                  {centang && (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="w-16 shrink-0 font-mono text-sm font-semibold tabular-nums text-stone-500 dark:text-stone-400">
                      {it.jam}
                    </span>
                    <span className={`font-medium ${centang ? "text-stone-400 line-through dark:text-stone-500" : ""}`}>
                      {it.judul}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${WARNA_JENIS[it.jenis]}`}>
                      {it.jenis}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400 sm:pl-[72px]">{it.keterangan}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-stone-200 p-5 dark:border-stone-800">
        <WaterCounter value={gelas} onChange={onGelas} />
      </div>
    </section>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange} className="flex w-full items-start gap-3 text-left">
      <span
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-emerald-500" : "bg-stone-300 dark:bg-stone-700"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-stone-500 dark:text-stone-400">{desc}</span>
      </span>
    </button>
  );
}
