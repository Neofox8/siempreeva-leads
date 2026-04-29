import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  // El webhook POST /api/leads es público — ManyChat no tiene sesión
  if (req.nextUrl.pathname === "/api/leads" && req.method === "POST") {
    return NextResponse.next();
  }

  const { supabase, getResponse } = createMiddlewareClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    if (req.nextUrl.pathname && req.nextUrl.pathname !== "/login") {
      url.searchParams.set("redirect", req.nextUrl.pathname);
    }
    return NextResponse.redirect(url);
  }

  return getResponse();
}

export const config = {
  matcher: ["/leads", "/leads/:path*", "/api/leads/:path*"],
};
