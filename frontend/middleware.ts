import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. Static files (favicon.ico, sitemap.xml, images, etc.)
     */
    '/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || 'localhost:3000';

  // 1. Extract clean subdomain
  const currentHost = hostname.replace(`:${url.port}`, '');
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'docuchain.ng';

  let subdomain: string | null = null;

  if (currentHost.includes('.localhost')) {
    subdomain = currentHost.replace('.localhost', '');
  } else if (currentHost.endsWith(`.${rootDomain}`)) {
    subdomain = currentHost.replace(`.${rootDomain}`, '');
  }

  // Prevent routing on main domain or www
  if (!subdomain || subdomain === 'www' || subdomain === 'app') {
    return NextResponse.next();
  }

  // 2. If accessing via a tenant subdomain (e.g., awolowo.docuchain.ng), rewrite to /portal with tenant context
  if (url.pathname === '/') {
    url.pathname = `/portal`;
    url.searchParams.set('tenant', subdomain);
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}