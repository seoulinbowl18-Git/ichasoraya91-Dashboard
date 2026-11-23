# ichasoraya91

Dashboard ERP internal toko multi-channel (TikTok Shop, Shopee, Lazada).

## Struktur

- `public/index.html`: dashboard (Ringkasan dan 16 menu operasional), saat ini masih data contoh
- `public/login.html`: halaman masuk dengan Google
- `middleware.js`: semua halaman wajib login
- `api/auth/*`: login, callback, me, logout dengan Google OAuth
- `lib/session.js`: cookie sesi bertanda tangan dan daftar email yang diizinkan

## Pengaturan login Google

1. Google Cloud Console > APIs & Services > Credentials > Create credentials > OAuth client ID > Web application.
2. Authorized redirect URI: `https://ichasoraya91.vercel.app/api/auth/callback`
3. Isi environment variables di Vercel (lihat `.env.example`), lalu redeploy.

Database (Supabase atau Railway PostgreSQL) belum dipasang.
