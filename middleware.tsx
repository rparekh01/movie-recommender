import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest){
    const {pathname} = request.nextUrl;

    //get token
    const token = await getToken({
        req:request,
        secret: process.env.NEXTAUTH_SECRET,
    })

    //check if the path requires authentication

    const isAuthRequired = [
        '/recommendations',
        '/profile'
    ].some(path => pathname.startsWith(path));

      // Redirect to login if the path requires authentication and there's no token
  if (isAuthRequired && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }

    // Redirect to homepage if the user is already logged in and trying to access login/register pages
    if (token && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/', request.url));
      }

return NextResponse.next();


}

// See https://nextjs.org/docs/messages/middleware-upgrade-guide
export const config = {
    matcher: [
      /*
       * Match all paths except for:
       * 1. /api routes
       * 2. /_next (Next.js internals)
       * 3. /fonts (inside /public)
       * 4. /examples (inside /public)
       * 5. all root files inside /public (e.g. /favicon.ico)
       */
      '/((?!api|_next|fonts|examples|[\\w-]+\\.\\w+).*)',
    ],
  };