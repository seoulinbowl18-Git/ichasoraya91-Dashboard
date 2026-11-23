-- Tabel awal ichasoraya91: data yang diisi tim lewat dashboard.
-- Semua akses lewat API server (kunci rahasia Supabase). RLS aktif tanpa policy,
-- jadi kunci publik (anon) tidak bisa membaca atau menulis apa pun.

create table public.tugas (
  id bigint generated always as identity primary key,
  judul text not null check (length(judul) between 1 and 500),
  selesai boolean not null default false,
  dibuat_oleh text not null,
  dibuat_pada timestamptz not null default now()
);

create table public.masalah_produk (
  id bigint generated always as identity primary key,
  produk text not null check (length(produk) between 1 and 200),
  masalah text not null check (length(masalah) between 1 and 1000),
  channel text not null check (channel in ('TikTok Shop', 'Shopee', 'Lazada')),
  status text not null default 'Baru' check (status in ('Baru', 'Diproses', 'Selesai')),
  dilaporkan_oleh text not null,
  dibuat_pada timestamptz not null default now()
);
create index masalah_produk_dibuat_pada_idx on public.masalah_produk (dibuat_pada desc);

create table public.riwayat_cetak (
  id bigint generated always as identity primary key,
  waktu timestamptz not null default now(),
  petugas text not null,
  jumlah integer not null check (jumlah > 0),
  printer text not null,
  nomor_pesanan text[] not null default '{}'
);
create index riwayat_cetak_waktu_idx on public.riwayat_cetak (waktu desc);

create table public.pengaturan (
  kunci text primary key,
  nilai jsonb not null,
  diubah_oleh text not null,
  diubah_pada timestamptz not null default now()
);

alter table public.tugas enable row level security;
alter table public.masalah_produk enable row level security;
alter table public.riwayat_cetak enable row level security;
alter table public.pengaturan enable row level security;

revoke all on public.tugas, public.masalah_produk, public.riwayat_cetak, public.pengaturan from anon, authenticated;

insert into public.pengaturan (kunci, nilai, diubah_oleh)
values ('aturan_otomatis', '{"a":true,"b":true,"c":false,"d":true,"e":false}', 'sistem');
