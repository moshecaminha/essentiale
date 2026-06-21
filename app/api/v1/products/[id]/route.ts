import { authorized, ok, unauthorized, badRequest, notFound, priceToCents } from "@/lib/api";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// GET /api/v1/products/:id  (id pode ser uuid ou slug)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!authorized(req)) return unauthorized();
  const sb = supabaseServer();
  const col = /^[0-9a-f-]{36}$/i.test(params.id) ? "id" : "slug";
  const { data } = await sb.from("products").select("*,category:categories(name,slug)").eq(col, params.id).maybeSingle();
  if (!data) return notFound();
  return ok({ product: data });
}

// PATCH /api/v1/products/:id  (atualiza preço, estoque, ativo, etc.)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!authorized(req)) return unauthorized();
  const b = await req.json().catch(() => null);
  if (!b) return badRequest("Corpo JSON inválido.");
  const sb = supabaseServer();
  const col = /^[0-9a-f-]{36}$/i.test(params.id) ? "id" : "slug";

  const patch: any = {};
  const pc = priceToCents(b);
  if (pc !== undefined) patch.price_cents = pc;
  if (b.stock_qty != null) patch.stock_qty = Number(b.stock_qty);
  if (b.low_stock_threshold != null) patch.low_stock_threshold = Number(b.low_stock_threshold);
  if (b.name != null) patch.name = b.name;
  if (b.description != null) patch.description = b.description;
  if (b.fragrance != null) patch.fragrance = b.fragrance;
  if (b.is_wholesale != null) patch.is_wholesale = b.is_wholesale === true;
  if (b.active != null) patch.active = b.active === true;
  if (b.image_url != null) patch.image_url = b.image_url;
  if (b.category_id != null) patch.category_id = b.category_id;
  if (Object.keys(patch).length === 0) return badRequest("Nenhum campo para atualizar.");

  const { data, error } = await sb.from("products").update(patch).eq(col, params.id).select("*").maybeSingle();
  if (error) return badRequest(error.message);
  if (!data) return notFound();
  return ok({ product: data });
}
