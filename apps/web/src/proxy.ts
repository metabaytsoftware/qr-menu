import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-internal-api-secret', secret);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: '/api/:path*',
};
