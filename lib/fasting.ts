import { ADAPTASI, ATURAN, HARI, KAMIS_FLEX, type DayCode, type Hari } from "./data";

export interface Settings {
  program_start: string; // "YYYY-MM-DD"
  kamis_flex: boolean;
  notifications: boolean;
}

export interface Jendela {
  mulai: string;
  selesai: string;
  pola: string;
  flex: boolean;
}

const KODE_DARI_GETDAY: DayCode[] = ["min", "sen", "sel", "rab", "kam", "jum", "sab"];

export const kodeHari = (d: Date): DayCode => KODE_DARI_GETDAY[d.getDay()];

/** Tanggal lokal dalam format YYYY-MM-DD. */
export function tanggalLokal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Minggu program ke-berapa (mulai dari 1) berdasarkan tanggal mulai. */
export function mingguProgram(programStart: string, now: Date): number {
  const [y, m, d] = programStart.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hari = Math.round((today.getTime() - start.getTime()) / 86_400_000);
  return Math.max(1, Math.floor(hari / 7) + 1);
}

export function tahapAdaptasi(programStart: string, now: Date) {
  const minggu = mingguProgram(programStart, now);
  return ADAPTASI[Math.min(minggu, 3) - 1];
}

/** Jendela makan efektif untuk suatu hari pada tanggal tertentu. */
export function jendelaUntuk(kode: DayCode, settings: Settings, tanggal: Date): Jendela {
  const tahap = tahapAdaptasi(settings.program_start, tanggal);
  // Mode Kamis fleksibel hanya relevan setelah masuk pola 16:8
  if (kode === "kam" && settings.kamis_flex && tahap.pola === "16:8") {
    return { ...KAMIS_FLEX, pola: "16:8", flex: true };
  }
  return { mulai: tahap.mulai, selesai: tahap.selesai, pola: tahap.pola, flex: false };
}

/** Data hari setelah disesuaikan dengan mode Kamis fleksibel. */
export function hariEfektif(hari: Hari, jendela: Jendela): Hari {
  if (!jendela.flex) return hari;
  return {
    ...hari,
    makanPertama: {
      jam: KAMIS_FLEX.mulai,
      menu: `Sarapan ringan saat kelas online, lalu ${hari.makanPertama.menu.toLowerCase()} setelah kelas`,
    },
    makanTerakhir: { jam: "17:30", menu: hari.makanTerakhir.menu },
  };
}

export const hariByKode = (kode: DayCode) => HARI.find((h) => h.kode === kode)!;

export function pada(tanggal: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(tanggal);
  d.setHours(h, m, 0, 0);
  return d;
}

export interface StatusPuasa {
  sedangPuasa: boolean;
  berikutnya: Date; // kapan status berubah
  sejak: Date; // kapan status saat ini dimulai
  jendela: Jendela;
}

export function statusSekarang(now: Date, settings: Settings): StatusPuasa {
  const kemarin = new Date(now);
  kemarin.setDate(now.getDate() - 1);
  const besok = new Date(now);
  besok.setDate(now.getDate() + 1);

  const jHariIni = jendelaUntuk(kodeHari(now), settings, now);
  const buka = pada(now, jHariIni.mulai);
  const tutup = pada(now, jHariIni.selesai);

  if (now < buka) {
    const jKemarin = jendelaUntuk(kodeHari(kemarin), settings, kemarin);
    return { sedangPuasa: true, berikutnya: buka, sejak: pada(kemarin, jKemarin.selesai), jendela: jHariIni };
  }
  if (now < tutup) {
    return { sedangPuasa: false, berikutnya: tutup, sejak: buka, jendela: jHariIni };
  }
  const jBesok = jendelaUntuk(kodeHari(besok), settings, besok);
  return { sedangPuasa: true, berikutnya: pada(besok, jBesok.mulai), sejak: tutup, jendela: jHariIni };
}

export function fmtDurasi(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export { ATURAN };
