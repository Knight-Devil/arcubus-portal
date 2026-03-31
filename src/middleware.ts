import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || "127.0.0.1";
    const OFFICE_IP = process.env.OFFICE_STATIC_IP;
    // const isLocalhost = clientIp === '::1' || clientIp === '127.0.0.1'; // use during testing only
    const isWFHUser = token?.workFromHome === true;

    // Helper: Determine if this user SHOULD be restricted by IP
    // Admins bypass IP checks. If no token, we can't check role yet.
    const isRestrictedUser = token && token.role !== 'admin';
    const isOffNetwork = clientIp !== OFFICE_IP && !isWFHUser;

    // If a restricted user is off-network, we must let them see the login page 
    // to show the error message. We only redirect them to dashboard if they are 
    // ON the office network.

    if (token && pathname === '/login') {
        if (isRestrictedUser && isOffNetwork) {
            console.log(">>> Off-network user at login: Staying here to show error.");
            return NextResponse.next(); 
        }
        console.log(">>> On-network/Admin at login: Redirecting to dashboard.");
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Allow the login page and its error variants to load for everyone else
    if (pathname === '/login') {
        return NextResponse.next();
    }

    if (pathname.startsWith('/dashboard')) {
        // 1. Not logged in?
        if (!token) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        // 2. Admin? Pass through immediately
        if (token.role === 'admin') {
            return NextResponse.next();
        }

        // 3. User IP Check
        if (isOffNetwork) {
            console.log(">>> Dashboard access denied: Not on office Wi-Fi.");
            return NextResponse.redirect(new URL('/login?error=not_on_office_wifi', req.url));
        }

        // 4. Device Secret Check
        const deviceCookie = req.cookies.get('device_login_secret')?.value;
        const dbSecret = token.dbSecret as string;

        // First login bypass
        if (!dbSecret || dbSecret === "") {
            return NextResponse.next();
        }

        if (!deviceCookie) {
            return NextResponse.redirect(new URL('/login?error=missing_info', req.url));
        }

        if (deviceCookie !== dbSecret) {
            return NextResponse.redirect(new URL('/login?error=wrong_laptop', req.url));
        }

        const userPermissions = (token.permissions as string[]) || [];
        // Guard the Crawler Tool
        if (pathname.startsWith('/dashboard/crawler')) {
            if (!userPermissions.includes('crawler')) {
                console.log(">>> Access Denied: Missing 'crawler' permission");
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }
        }

        // Guard the Disposition Tool
        if (pathname.startsWith('/dashboard/disposition')) {
            if (!userPermissions.includes('disposition')) {
                console.log(">>> Access Denied: Missing 'disposition' permission");
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};