import { supabaseAuth } from "@/lib/supabaseAuth";
import { supabaseServer } from "@/lib/supabaseServer";

// Retorna o usuário autenticado e a linha de cliente correspondente,
// criando-a se ainda não existir (vinculada ao auth_user_id).
export async function getCurrentCustomer() {
  const auth = supabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return { user: null, customer: null };

  const sb = supabaseServer();
  let { data: customer } = await sb.from("customers").select("*").eq("auth_user_id", user.id).maybeSingle();
  if (!customer) {
    const { data } = await sb.from("customers").insert({
      auth_user_id: user.id,
      full_name: (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Cliente",
      email: user.email,
    }).select("*").single();
    customer = data;
  }
  return { user, customer };
}
