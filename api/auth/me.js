// Data user yang sedang login (untuk nama dan foto di topbar).
import { COOKIE, isAllowed, readCookie, verify } from '../../lib/session.js';

export async function GET(request) {
  const u = await verify(readCookie(request, COOKIE));
  if (!u || !isAllowed(u.email)) return new Response(JSON.stringify({ error: 'Belum login' }), { status: 401, headers: { 'content-type': 'application/json' } });
  return Response.json({ email: u.email, name: u.name, picture: u.picture });
}
