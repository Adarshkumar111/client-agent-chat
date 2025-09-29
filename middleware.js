import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })
  
  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/chat', '/groups', '/direct-chat', '/my-notes']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // If accessing protected route without auth, redirect to signin
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (token && request.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/chat/:path*', '/groups/:path*', '/direct-chat/:path*', '/my-notes/:path*', '/auth/:path*']
}