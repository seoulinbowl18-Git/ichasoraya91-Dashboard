// Akses database Supabase lewat REST (PostgREST), hanya dari server.
// Butuh env SUPABASE_URL dan SUPABASE_SECRET_KEY (kunci rahasia, jangan pernah dikirim ke browser).

export const dbReady = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);

export async function db(path, { method = 'GET', body, prefer } = {}) {
  const key = process.env.SUPABASE_SECRET_KEY;
  const headers = { apikey: key, 'content-type': 'application/json' };
  // Kunci lama (service_role) berbentuk JWT dan juga harus dikirim sebagai Bearer.
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${process.env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`Supabase ${res.status}: ${text.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return text ? JSON.parse(text) : null;
}

// Awal hari ini menurut jam WIB (UTC+7), dalam format ISO.
export function awalHariIniWIB(now = Date.now()) {
  const wib = new Date(now + 7 * 3600e3);
  wib.setUTCHours(0, 0, 0, 0);
  return new Date(wib.getTime() - 7 * 3600e3).toISOString();
}
