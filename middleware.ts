import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token =
    req.cookies.get('authjs.session-token') ??
    req.cookies.get('__Secure-authjs.session-token')
  const isLoggedIn = !!token

  if (pathname.startsWith('/login')) {
    if (isLoggedIn) return NextResponse.redirect(new URL('/dashboard', req.url))
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
