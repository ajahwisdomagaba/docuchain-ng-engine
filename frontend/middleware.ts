import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || 'localhost:3000';

  // Define root domain
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

  // Extract subdomain (e.g., "adelowo" from "adelowo.docuchain.ng" or "adelowo.localhost:3000")
  let currentHost = hostname.replace(`.${rootDomain}`, '');

  // Handle local dev or no subdomain
  const isSubdomain = 
    currentHost !== hostname && 
    currentHost !== 'www' && 
    currentHost !== 'app' && 
    !currentHost.includes('localhost');

  const response = NextResponse.next();

  if (isSubdomain) {
    // Set custom tenant headers for downstream pages to read
    response.headers.set('x-tenant-subdomain', currentHost);
  }

  return response;
}