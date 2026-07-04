import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => res.cookies.set({ name, value, ...options }),
        remove: (name: string, options: any) => res.cookies.set({ name, value: "", ...options }),
      },
    }
  );

  // Use getSession() instead of getUser() — reads cookie locally, no network call
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isApi = req.nextUrl.pathname.startsWith("/api");

  if (!user && !isAuthPage && !isApi) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/sales/:path*", "/purchases/:path*", "/expenses/:path*", "/login/:path*"],
};