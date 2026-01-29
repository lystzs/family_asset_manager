import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Proxy API requests to backend
    if (pathname.startsWith('/api/proxy/')) {
        const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://backend:8000';
        const apiPath = pathname.replace('/api/proxy', '');

        const url = new URL(apiPath, backendUrl);
        url.search = request.nextUrl.search;

        // Rewrite to backend
        return NextResponse.rewrite(url);
    }

    // Proxy WebSocket requests
    if (pathname.startsWith('/ws/')) {
        const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://backend:8000';
        const wsPath = pathname;

        const url = new URL(wsPath, backendUrl);
        url.search = request.nextUrl.search;

        return NextResponse.rewrite(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/proxy/:path*', '/ws/:path*'],
};
