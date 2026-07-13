import { NextResponse } from "next/server";
import { updateSession } from "./app/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request) {
    // refresh cookie
    const response = await updateSession(request);

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        },
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    const protectedRoutes = ["/game"];

    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

    // ยังไม่ได้ login
    if (!user && isProtected) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // login แล้วไม่ให้กลับหน้า login
    if (user && (pathname === "/login" || pathname === "/register")) {
        return NextResponse.redirect(new URL("/game", request.url));
    }

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
