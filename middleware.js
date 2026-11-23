// Semua halaman wajib login, kecuali halaman login dan endpoint auth.
import { COOKIE, readCookie, verify } from './lib/session.js';

export const config = {
  matcher: ['/((?!api/auth|login\\.html|favicon\\.ico).*)'],
};

export default async function middleware(request) {
  const user = await verify(readCookie(request, COOKIE));
  if (user) return; // lanjut ke halaman
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Belum login' }), { status: 401, headers: { 'content-type': 'application/json' } });
  }
  return Response.redirect(new URL('/login.html', request.url), 302);
}
