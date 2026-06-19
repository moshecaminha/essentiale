import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sha256, ADMIN_COOKIE } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const pw = process.env.ADMIN_PASSWORD;
  // Proteção desativada enquanto não houver senha configurada (evita travar o acesso).
  if (!pw) return NextResponse.next();

  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  const expected = await sha256(pw);
  if (cookie === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
