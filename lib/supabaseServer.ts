import { createClient } from "@supabase/supabase-js";

// Cliente para Server Components. Usa a service_role se disponível
// (acesso total, ideal para o painel interno); caso contrário, cai na
// chave pública (que respeita o RLS — lê só o catálogo).
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: (input: any, init?: any) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

// Indica se o painel está com acesso completo (clientes, pedidos, RFM)
export const hasFullAccess = () => !!process.env.SUPABASE_SERVICE_ROLE_KEY;
