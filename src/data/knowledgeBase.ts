import type { Source } from "../types/Message";

// Knowledge base = kumpulan potongan (chunk) dokumen akademik.
// CONTOH dummy dulu. Nanti diganti potongan dokumen TUS asli.
// Tiap entri punya bentuk yang sama dengan tipe Source.
export const knowledgeBase: Source[] = [
  {
    id: "doc-ssc",
    source: "Profil Layanan SSC",
    text: "Student Service Center (SSC) melayani mahasiswa terkait administrasi akademik. Layanan tatap muka buka hari Senin sampai Jumat pukul 08.00 hingga 16.00 WIB di gedung pusat kampus. Di luar jam tersebut mahasiswa dapat menggunakan layanan chatbot.",
  },
  {
    id: "doc-ukt",
    source: "Panduan Keuangan Mahasiswa",
    text: "Pembayaran UKT dilakukan setiap awal semester melalui virtual account bank yang ditunjuk kampus. Batas akhir pembayaran umumnya dua minggu sebelum perkuliahan dimulai. Keterlambatan pembayaran dikenakan denda dan dapat menghambat pengisian KRS.",
  },
  {
    id: "doc-krs",
    source: "Panduan Pengisian KRS",
    text: "Pengisian Kartu Rencana Studi (KRS) dilakukan di awal semester melalui portal akademik. Mahasiswa wajib berkonsultasi dengan dosen wali, dan KRS baru berlaku setelah disetujui oleh dosen wali.",
  },
  {
    id: "doc-cuti",
    source: "Peraturan Akademik - Cuti",
    text: "Cuti akademik dapat diajukan paling banyak dua semester selama masa studi. Pengajuan dilakukan melalui SSC dengan persetujuan dosen wali dan ketua program studi, paling lambat sebelum masa pengisian KRS.",
  },
  {
    id: "doc-skripsi",
    source: "Panduan Tugas Akhir",
    text: "Tugas akhir atau skripsi dapat diambil setelah mahasiswa menempuh minimal 120 SKS. Mahasiswa mengajukan topik kepada koordinator tugas akhir, kemudian akan ditunjuk seorang dosen pembimbing.",
  },
  {
    id: "doc-lulus",
    source: "Pedoman Akademik - Kelulusan",
    text: "Syarat kelulusan program sarjana yaitu menyelesaikan minimal 144 SKS, memiliki IPK minimal 2.00, dan dinyatakan lulus sidang tugas akhir. Pendaftaran wisuda dibuka setiap periode melalui portal akademik.",
  },
  {
    id: "doc-transkrip",
    source: "Layanan Administrasi SSC",
    text: "Permohonan transkrip nilai resmi diajukan melalui SSC. Transkrip nilai resmi diterbitkan paling lambat tiga hari kerja sejak permohonan diterima.",
  },
];