import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES  = ['/login', '/register', '/forgot-password'];
const PROTECTED_BASE = ['/chat', '/rooms', '/profile'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebase-auth-token')?.value;

  const isPublic    = PUBLIC_ROUTES.some(r  => pathname.startsWith(r));
  const isProtected = PROTECTED_BASE.some(r => pathname.startsWith(r));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (isPublic && token) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
