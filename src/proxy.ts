import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'rimal-super-secret-key-change-in-prod';
const key = new TextEncoder().encode(SECRET_KEY);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public paths that do not require auth
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname === '/icon.jpg' || pathname === '/logo.jpg') {
    return NextResponse.next();
  }

  const token = request.cookies.get('rimal_session')?.value;

  // Define route paths
  const isPosRoute = pathname.startsWith('/pos') && !pathname.startsWith('/pos/login');
  const isPosLogin = pathname.startsWith('/pos/login');
  const isAdminRoute = !pathname.startsWith('/pos') && !pathname.startsWith('/admin/login') && pathname !== '/';
  const isAdminLogin = pathname.startsWith('/admin/login');

  // If no token, redirect to login
  if (!token) {
    if (isPosRoute) return NextResponse.redirect(new URL('/pos/login', request.url));
    if (isAdminRoute) return NextResponse.redirect(new URL('/admin/login', request.url));
    if (pathname === '/') return NextResponse.redirect(new URL('/admin/login', request.url));
    return NextResponse.next();
  }

  try {
    // Verify token
    const { payload } = await jwtVerify(token, key);
    const role = payload.role as string;
    
    // If ALREADY logged in, prevent accessing login pages
    if (role === 'CASHIER') {
      if (isAdminRoute || isPosLogin) {
        return NextResponse.redirect(new URL('/pos', request.url));
      }
    } else {
      // ADMIN or MANAGER
      if (isPosLogin || isAdminLogin) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Root path redirect based on role
    if (pathname === '/') {
      if (role === 'CASHIER') return NextResponse.redirect(new URL('/pos', request.url));
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (err) {
    // Invalid token, clear it and redirect to login
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete('rimal_session');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.jpg|logo.jpg).*)',
  ],
};
