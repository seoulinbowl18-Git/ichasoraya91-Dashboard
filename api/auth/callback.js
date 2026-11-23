// Google mengembalikan kode -> tukar jadi profil -> cek email diizinkan -> buat sesi.
import { COOKIE, cookieHeader, isAllowed, readCookie, sign } from '../../lib/session.js';

const back = (origin, err) =>
  new Response(null, { status: 302, headers: { Location: `${origin}/login.html?error=${err}` } });

export async function GET(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state || state !== readCookie(request, 'ics91_state')) return back(origin, 'state');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: `${origin}/api/auth/callback`,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) return back(origin, 'token');
  const { access_token } = await tokenRes.json();

  const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!infoRes.ok) return back(origin, 'profil');
  const u = await infoRes.json();
  if (!u.email_verified || !isAllowed(u.email)) return back(origin, 'ditolak');

  const days = 7;
  const token = await sign({ email: u.email, name: u.name || '', picture: u.picture || '', exp: Date.now() + days * 864e5 });
  const headers = new Headers({ Location: `${origin}/` });
  headers.append('Set-Cookie', cookieHeader(COOKIE, token, days * 86400));
  headers.append('Set-Cookie', cookieHeader('ics91_state', '', 0));
  return new Response(null, { status: 302, headers });
}
