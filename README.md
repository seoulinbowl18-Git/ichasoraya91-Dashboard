# ichasoraya91

Dashboard ERP internal toko multi-channel (TikTok Shop, Shopee, Lazada).

## Struktur

- `public/index.html`: dashboard (Ringkasan dan 16 menu operasional), saat ini masih data contoh
- `public/login.html`: halaman masuk dengan Google
- `middleware.js`: semua halaman wajib login
- `api/auth/*`: login, callback, me, logout dengan Google OAuth
- `lib/session.js`: cookie sesi bertanda tangan dan daftar email yang diizinkan (dicek ulang di setiap permintaan)
- `api/data.js`: data bersama tim (tugas, masalah produk, riwayat cetak, aturan otomatis)
- `lib/db.js`: akses Supabase dari server
- `supabase/migrations/`: skema tabel database

## Pengaturan login Google

1. Google Cloud Console > APIs & Services > Credentials > Create credentials > OAuth client ID > Web application.
2. Authorized redirect URI: `https://ichasoraya91.vercel.app/api/auth/callback`
3. Isi environment variables di Vercel (lihat `.env.example`), lalu redeploy.

## Database (Supabase)

1. Jalankan isi `supabase/migrations/` di proyek Supabase (SQL Editor, atau `supabase db push`).
2. Isi `SUPABASE_URL` dan `SUPABASE_SECRET_KEY` di Vercel, lalu redeploy.

Selama dua env itu belum diisi, `/api/data` menjawab 503 dan dashboard tetap memakai penyimpanan browser seperti sebelumnya.
Data pesanan, stok, dan angka ringkasan masih data contoh sampai marketplace disambungkan.
