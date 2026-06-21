import { authorized, ok, unauthorized, badRequest, priceToCents } from "@/lib/api";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// GET /api/v1/products?q=&category=&fragrance=&active=true&wholesale=false&limit=50
export async function GET(req: Request) {
  if (!authorized(req)) return unauthorized();
  const u = new URL(req.url);
  const sb = supabaseServer();
  let q = sb.from("products").select("id,name,slug,price_cents,compare_at_cents,stock_qty,low_stock_threshold,active,is_wholesale,fragrance,image_url,description,category:categories(name,slug)").order("name");
  const active = u.searchParams.get("active");
  if (active === "true") q = q.eq("active", true);
  if (active === "false") q = q.eq("active", false);
  const wholesale = u.searchParams.get("wholesale");
  if (wholesale === "true") q = q.eq("is_wholesale", true);
  if (wholesale === "false") q = q.eq("is_wholesale", false);
  const fr = u.searchParams.get("fragrance");
  if (fr) q = q.eq("fragrance", fr);
  const term = u.searchParams.get("q");
  if (term) q = q.ilike("name", `%${term}%`);
  q = q.limit(Math.min(200, Number(u.searchParams.get("limit") || 100)));
  const { data, error } = await q;
  if (error) return badRequest(error.message);
  let rows = data ?? [];
  const cat = u.searchParams.get("category");
  if (cat) rows = (rows as any[]).filter((p) => p.category?.slug === cat || p.category?.name === cat);
  return ok({ products: rows, count: rows.length });
}

// POST /api/v1/products  (cria produto)
export async function POST(req: Request) {
  if (!authorized(req)) return unauthorized();
  const b = await req.json().catch(() => null);
  if (!b || !b.name) return badRequest("Campo 'name' é obrigatório.");
  const sb = supabaseServer();

  let category_id = b.category_id ?? null;
  if (!category_id && b.category) {
    const { data: c } = await sb.from("categories").select("id").or(`slug.eq.${b.category},name.eq.${b.category}`).maybeSingle();
    category_id = c?.id ?? null;
  }
  const fields: any = {
    name: b.name,
    slug: b.slug || slugify(b.name),
    price_cents: priceToCents(b) ?? 0,
    stock_qty: b.stock_qty != null ? Number(b.stock_qty) : 0,
    low_stock_threshold: b.low_stock_threshold != null ? Number(b.low_stock_threshold) : 10,
    description: b.description ?? null,
    fragrance: b.fragrance ?? null,
    is_wholesale: b.is_wholesale === true,
    active: b.active !== false,
    image_url: b.image_url ?? null,
    category_id,
  };
  const { data, error } = await sb.from("products").insert(fields).select("*").single();
  if (error) return badRequest(error.message);
  return ok({ product: data }, 201);
}
