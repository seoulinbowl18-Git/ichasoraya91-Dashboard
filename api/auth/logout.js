import { COOKIE, cookieHeader } from '../../lib/session.js';

export async function GET(request) {
  return new Response(null, {
    status: 302,
    headers: { Location: `${new URL(request.url).origin}/login.html`, 'Set-Cookie': cookieHeader(COOKIE, '', 0) },
  });
}
