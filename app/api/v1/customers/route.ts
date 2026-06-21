import { authorized, ok, unauthorized, badRequest } from "@/lib/api";
import { supabaseServer } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";
const digits = (s: any) => String(s || "").replace(/\D/g, "");

// GET /api/v1/customers?q=&limit=50
export async function GET(req: Request) {
  if (!authorized(req)) return unauthorized();
  const u = new URL(req.url);
  const sb = supabaseServer();
  let q = sb.from("customers").select("id,full_name,phone,email,city,uf,orders_count,total_spent_cents,created_at").order("created_at", { ascending: false }).limit(Math.min(200, Number(u.searchParams.get("limit") || 50)));
  const term = u.searchParams.get("q");
  if (term) q = q.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
  const { data, error } = await q;
  if (error) return badRequest(error.message);
  return ok({ customers: data ?? [] });
}

// POST /api/v1/customers  (upsert por telefone)
export async function POST(req: Request) {
  if (!authorized(req)) return unauthorized();
  const b = await req.json().catch(() => null);
  if (!b) return badRequest("Corpo JSON inválido.");
  const phone = digits(b.phone);
  const sb = supabaseServer();
  const fields: any = {
    full_name: b.name || b.full_name, phone: phone || null, email: b.email || null,
    cep: b.cep || null, street: b.street || null, number: b.number || null, complement: b.complement || null,
    district: b.district || null, city: b.city || null, uf: b.uf || null,
  };
  Object.keys(fields).forEach((k) => fields[k] == null && delete fields[k]);
  if (phone) {
    const { data: found } = await sb.from("customers").select("id").eq("phone", phone).maybeSingle();
    if (found) {
      const { data } = await sb.from("customers").update(fields).eq("id", found.id).select("*").single();
      return ok({ customer: data, created: false });
    }
  }
  const { data, error } = await sb.from("customers").insert({ full_name: fields.full_name || "Cliente WhatsApp", ...fields }).select("*").single();
  if (error) return badRequest(error.message);
  return ok({ customer: data, created: true }, 201);
}
