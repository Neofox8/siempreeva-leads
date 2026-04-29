import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
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

// Protegemos:
//   /leads y subrutas        → dashboard
//   /api/leads/<id>          → PATCH inline edit (NO el POST raíz, que es el webhook público)
export const config = {
  matcher: ["/leads", "/leads/:path*", "/api/leads/:id"],
};
