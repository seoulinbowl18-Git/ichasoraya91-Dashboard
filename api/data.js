// Data bersama tim: tugas, masalah produk, riwayat cetak, aturan otomatis.
// GET mengambil semua; POST menambah; PATCH mengubah; DELETE menghapus; PUT menyimpan aturan.
import { awalHariIniWIB, db, dbReady } from '../lib/db.js';
import { COOKIE, isAllowed, readCookie, verify } from '../lib/session.js';

const CHANNEL = ['TikTok Shop', 'Shopee', 'Lazada'];
const STATUS = ['Baru', 'Diproses', 'Selesai'];
const ATURAN = ['a', 'b', 'c', 'd', 'e'];

const json = (data, status = 200) => Response.json(data, { status });
const salah = (pesan, status = 400) => json({ error: pesan }, status);
const teks = (v, maks) => (typeof v === 'string' && v.trim() && v.trim().length <= maks ? v.trim() : null);
const idValid = (v) => (Number.isInteger(v) && v > 0 ? v : null);

const jamWIB = (iso) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).replace(':', '.');

const ke = {
  tugas: (r) => ({ id: r.id, t: r.judul, d: r.selesai }),
  masalah: (r) => ({ id: r.id, p: r.produk, m: r.masalah, c: r.channel, s: r.status }),
  cetak: (r) => ({ id: r.id, w: jamWIB(r.waktu), u: r.petugas, n: r.jumlah, p: r.printer, ids: r.nomor_pesanan }),
};

async function pengguna(request) {
  const u = await verify(readCookie(request, COOKIE));
  if (!u || !isAllowed(u.email)) return null;
  return { ...u, panggilan: (u.name || u.email.split('@')[0]).split(' ')[0] };
}

// Semua method lewat satu pintu: cek login, cek database, tangani error.
async function pintu(request, kerja) {
  const u = await pengguna(request);
  if (!u) return salah('Belum login', 401);
  if (!dbReady()) return salah('Database belum disambungkan', 503);
  let body = {};
  if (request.method !== 'GET') {
    try {
      body = await request.json();
    } catch {
      return salah('Isi permintaan tidak valid');
    }
  }
  try {
    return await kerja(body || {}, u);
  } catch (e) {
    console.error(e);
    return salah('Gagal menghubungi database', 502);
  }
}

export const GET = (request) =>
  pintu(request, async () => {
    const hariIni = encodeURIComponent(awalHariIniWIB());
    const [tugas, masalah, cetak, aturan] = await Promise.all([
      db('tugas?select=*&order=dibuat_pada.desc&limit=500'),
      db('masalah_produk?select=*&order=dibuat_pada.asc&limit=500'),
      db(`riwayat_cetak?select=*&waktu=gte.${hariIni}&order=waktu.asc`),
      db('pengaturan?select=nilai&kunci=eq.aturan_otomatis'),
    ]);
    return json({
      task: tugas.map(ke.tugas),
      mp: masalah.map(ke.masalah),
      log: cetak.map(ke.cetak),
      printed: [...new Set(cetak.flatMap((r) => r.nomor_pesanan))],
      sd: aturan[0]?.nilai || {},
    });
  });

export const POST = (request) =>
  pintu(request, async (b, u) => {
    const balik = { prefer: 'return=representation', method: 'POST' };
    if (b.jenis === 'tugas') {
      const judul = teks(b.judul, 500);
      if (!judul) return salah('Tugas kosong atau terlalu panjang');
      const [r] = await db('tugas', { ...balik, body: { judul, dibuat_oleh: u.email } });
      return json(ke.tugas(r), 201);
    }
    if (b.jenis === 'masalah') {
      const produk = teks(b.produk, 200), masalah = teks(b.masalah, 1000);
      if (!produk || !masalah || !CHANNEL.includes(b.channel)) return salah('Data laporan tidak lengkap');
      const [r] = await db('masalah_produk', { ...balik, body: { produk, masalah, channel: b.channel, dilaporkan_oleh: u.email } });
      return json(ke.masalah(r), 201);
    }
    if (b.jenis === 'cetak') {
      const nomor = Array.isArray(b.nomor_pesanan) ? b.nomor_pesanan.filter((x) => teks(x, 64)).map(String) : [];
      const printer = teks(b.printer, 100);
      if (!nomor.length || nomor.length > 1000 || !printer) return salah('Data cetak tidak lengkap');
      const [r] = await db('riwayat_cetak', { ...balik, body: { petugas: u.panggilan, jumlah: nomor.length, printer, nomor_pesanan: nomor } });
      return json(ke.cetak(r), 201);
    }
    return salah('Jenis data tidak dikenal');
  });

export const PATCH = (request) =>
  pintu(request, async (b) => {
    const id = idValid(b.id);
    if (!id) return salah('ID tidak valid');
    const ubah = { method: 'PATCH', prefer: 'return=representation' };
    if (b.jenis === 'tugas' && typeof b.selesai === 'boolean') {
      const [r] = await db(`tugas?id=eq.${id}`, { ...ubah, body: { selesai: b.selesai } });
      return r ? json(ke.tugas(r)) : salah('Tugas tidak ditemukan', 404);
    }
    if (b.jenis === 'masalah' && STATUS.includes(b.status)) {
      const [r] = await db(`masalah_produk?id=eq.${id}`, { ...ubah, body: { status: b.status } });
      return r ? json(ke.masalah(r)) : salah('Laporan tidak ditemukan', 404);
    }
    return salah('Perubahan tidak dikenal');
  });

export const DELETE = (request) =>
  pintu(request, async (b) => {
    const id = idValid(b.id);
    if (b.jenis !== 'tugas' || !id) return salah('Hanya tugas yang bisa dihapus');
    await db(`tugas?id=eq.${id}`, { method: 'DELETE' });
    return json({ ok: true });
  });

export const PUT = (request) =>
  pintu(request, async (b, u) => {
    if (b.jenis !== 'aturan' || !b.nilai || typeof b.nilai !== 'object') return salah('Data aturan tidak valid');
    const nilai = Object.fromEntries(ATURAN.map((k) => [k, b.nilai[k] === true]));
    await db('pengaturan?on_conflict=kunci', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: { kunci: 'aturan_otomatis', nilai, diubah_oleh: u.email, diubah_pada: new Date().toISOString() },
    });
    return json(nilai);
  });
