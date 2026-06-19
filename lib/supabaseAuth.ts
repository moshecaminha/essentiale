import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente que enxerga a sessão do cliente logado (via cookies).
export function supabaseAuth() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(list: { name: string; value: string; options?: any }[]) {
          try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* server component */ }
        },
      },
    }
  );
}
