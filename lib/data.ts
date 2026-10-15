export type DayCode = "sen" | "sel" | "rab" | "kam" | "jum" | "sab" | "min";
export type ItemId = "pagi" | "m1" | "cm" | "m2" | "tutup" | "air";
export type ItemKind = "puasa" | "makan" | "umum";

export interface Kuliah {
  matkul: string;
  mulai: string;
  selesai: string;
  ruang: string;
  online?: boolean;
}

export interface Makan {
  jam: string;
  menu: string;
}

export interface Hari {
  kode: DayCode;
  nama: string;
  kuliah: Kuliah[];
  makanPertama: Makan;
  camilan: Makan;
  makanTerakhir: Makan;
  catatan: string | null;
}

export interface ChecklistItem {
  id: ItemId;
  jam: string;
  judul: string;
  keterangan: string;
  jenis: ItemKind;
}

export const ITEM_IDS: ItemId[] = ["pagi", "m1", "cm", "m2", "tutup", "air"];

export const ATURAN = {
  jendelaMakan: { mulai: "11:30", selesai: "19:30" },
  targetAir: 8,
  itemPerHari: 6,
} as const;

export const ADAPTASI = [
  { minggu: 1, pola: "12:12", mulai: "08:00", selesai: "20:00" },
  { minggu: 2, pola: "14:10", mulai: "10:00", selesai: "20:00" },
  { minggu: 3, pola: "16:8", mulai: "11:30", selesai: "19:30" },
] as const;

export const KAMIS_FLEX = { mulai: "10:00", selesai: "18:00" } as const;

export const HARI: Hari[] = [
  {
    kode: "sen",
    nama: "Senin",
    kuliah: [
      { matkul: "Pemrograman Mobile Lanjut", mulai: "13:00", selesai: "14:40", ruang: "Computer Laboratory 1" },
    ],
    makanPertama: { jam: "11:30", menu: "Nasi ½, ayam bakar, sayur bayam, tempe" },
    camilan: { jam: "15:00", menu: "Pisang + telur rebus" },
    makanTerakhir: { jam: "19:00", menu: "Gado-gado tanpa kerupuk" },
    catatan: null,
  },
  {
    kode: "sel",
    nama: "Selasa",
    kuliah: [
      { matkul: "Kualitas Perangkat Lunak", mulai: "07:00", selesai: "09:30", ruang: "6102" },
      { matkul: "Industrial Software Engineering", mulai: "13:00", selesai: "16:20", ruang: "6102" },
    ],
    makanPertama: { jam: "11:30", menu: "Porsi lengkap: nasi ½, ikan pindang, tumis kangkung, tahu" },
    camilan: { jam: "16:30", menu: "Pisang, telur rebus, atau roti (bawa di tas)" },
    makanTerakhir: { jam: "19:00", menu: "Pecel sayur + tempe" },
    catatan:
      "Hari padat. Makan pertama harus lengkap dan tinggi protein. Bawa camilan di tas untuk dimakan setelah kelas selesai 16.20.",
  },
  {
    kode: "rab",
    nama: "Rabu",
    kuliah: [
      { matkul: "Interaksi Manusia dan Komputer", mulai: "07:50", selesai: "09:30", ruang: "6102" },
    ],
    makanPertama: { jam: "11:30", menu: "Nasi ½, telur balado, sayur sop" },
    camilan: { jam: "15:30", menu: "Kacang rebus" },
    makanTerakhir: { jam: "19:00", menu: "Soto ayam bening, nasi sedikit" },
    catatan: null,
  },
  {
    kode: "kam",
    nama: "Kamis",
    kuliah: [
      { matkul: "Pemrograman Gim", mulai: "07:00", selesai: "09:30", ruang: "Computer Laboratory 1" },
      { matkul: "Etika Profesi", mulai: "10:00", selesai: "11:40", ruang: "Online", online: true },
      { matkul: "Metodologi Penelitian dan Penulisan Ilmiah", mulai: "13:00", selesai: "15:30", ruang: "6102" },
    ],
    makanPertama: { jam: "11:45", menu: "Nasi ½, pepes ikan, urap, tempe" },
    camilan: { jam: "15:45", menu: "Pepaya atau telur rebus" },
    makanTerakhir: { jam: "19:00", menu: "Nasi ½ + tahu tempe bakar + lalapan" },
    catatan:
      "Puasa berlangsung selama kelas 07.00–11.40. Jika terasa berat, jendela makan hari ini boleh dimajukan ke 10.00–18.00 dan sarapan ringan saat kelas online.",
  },
  {
    kode: "jum",
    nama: "Jumat",
    kuliah: [
      { matkul: "Interaksi Kecerdasan Buatan", mulai: "13:00", selesai: "14:40", ruang: "6102" },
    ],
    makanPertama: { jam: "11:30", menu: "Nasi ½, ayam tanpa kulit, sayur asem" },
    camilan: { jam: "15:00", menu: "Oatmeal + pisang" },
    makanTerakhir: { jam: "19:00", menu: "Capcay kuah + telur" },
    catatan: null,
  },
  {
    kode: "sab",
    nama: "Sabtu",
    kuliah: [],
    makanPertama: { jam: "11:30", menu: "Nasi ½, ikan bakar, sayur lodeh sedikit kuah" },
    camilan: { jam: "15:30", menu: "Jeruk + telur rebus" },
    makanTerakhir: { jam: "19:00", menu: "Pecel ayam, nasi ½, banyak lalapan" },
    catatan: null,
  },
  {
    kode: "min",
    nama: "Minggu",
    kuliah: [],
    makanPertama: { jam: "11:30", menu: "Bebas tapi seimbang: nasi ½, lauk protein, sayur" },
    camilan: { jam: "15:30", menu: "Buah" },
    makanTerakhir: { jam: "19:00", menu: "Sup sayur + tahu" },
    catatan: null,
  },
];

export const TIPS_WARTEG = [
  "Minta nasi setengah dan sayur dibanyakin.",
  "Pilih lauk bakar, pepes, bacem, rebus; kurangi gorengan bertepung.",
  "Minta kuah santan dan sambal sedikit.",
  "Minum air putih atau teh tawar, bukan es teh manis.",
];

export const PERINGATAN =
  "Hentikan puasa dan makan dulu jika perut perih, badan gemetar, atau pusing. Konsultasikan ke dokter jika memiliki kondisi seperti maag/asam lambung atau diabetes.";

/** Ubah "11:30" menjadi "11.30" (format penulisan jam Indonesia). */
export const fmtJam = (hhmm: string) => hhmm.replace(":", ".");

export function checklistUntuk(hari: Hari, jendela: { mulai: string; selesai: string }): ChecklistItem[] {
  return [
    {
      id: "pagi",
      jam: "Pagi",
      judul: "Puasa: air putih, teh tawar, atau kopi hitam",
      keterangan: hari.kuliah.some((k) => k.mulai < "11:00" && !k.online)
        ? "Ada kelas pagi — bawa botol minum"
        : "Bawa botol minum kalau ada kelas pagi",
      jenis: "puasa",
    },
    { id: "m1", jam: fmtJam(hari.makanPertama.jam), judul: "Makan pertama", keterangan: hari.makanPertama.menu, jenis: "makan" },
    { id: "cm", jam: fmtJam(hari.camilan.jam), judul: "Camilan", keterangan: hari.camilan.menu, jenis: "makan" },
    { id: "m2", jam: fmtJam(hari.makanTerakhir.jam), judul: "Makan terakhir", keterangan: hari.makanTerakhir.menu, jenis: "makan" },
    {
      id: "tutup",
      jam: fmtJam(jendela.selesai),
      judul: "Jendela makan tutup",
      keterangan: "Setelah ini cukup minum air putih",
      jenis: "puasa",
    },
    {
      id: "air",
      jam: "Seharian",
      judul: `Minum ${ATURAN.targetAir} gelas air putih`,
      keterangan: "Ganti es teh manis dengan air atau teh tawar",
      jenis: "umum",
    },
  ];
}
