import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sha256, ADMIN_COOKIE } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  // Atualiza a sessão do cliente (Supabase Auth)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(list: { name: string; value: string; options?: any }[]) {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;

  // Protege a área do cliente
  if (path.startsWith("/conta") && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Protege o painel admin (senha)
  if (path === "/admin" || path.startsWith("/admin/")) {
    const pw = process.env.ADMIN_PASSWORD;
    if (pw) {
      const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
      const expected = await sha256(pw);
      if (cookie !== expected) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  return res;
}

export const config = { matcher: ["/admin", "/admin/:path*", "/conta", "/conta/:path*"] };
