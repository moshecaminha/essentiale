import { authorized, ok, unauthorized, badRequest, notFound } from "@/lib/api";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const SHIP_MAP: Record<string, string> = { pago: "preparando", em_separacao: "preparando", enviado: "postado", a_caminho: "saiu_para_entrega", entregue: "entregue" };

// GET /api/v1/orders/:id  (id ou número do pedido)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!authorized(req)) return unauthorized();
  const sb = supabaseServer();
  const col = /^[0-9a-f-]{36}$/i.test(params.id) ? "id" : "order_number";
  const { data } = await sb.from("orders")
    .select("*,customer:customers(id,full_name,phone,email),items:order_items(*),payments(*),shipments(*)")
    .eq(col, params.id).maybeSingle();
  if (!data) return notFound();
  return ok({ order: data });
}

// PATCH /api/v1/orders/:id  { status, payment_status }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!authorized(req)) return unauthorized();
  const b = await req.json().catch(() => null);
  if (!b) return badRequest("Corpo JSON inválido.");
  const sb = supabaseServer();
  const col = /^[0-9a-f-]{36}$/i.test(params.id) ? "id" : "order_number";
  const { data: order } = await sb.from("orders").select("id").eq(col, params.id).maybeSingle();
  if (!order) return notFound();

  const valid = ["aguardando_pagamento", "pago", "em_separacao", "enviado", "a_caminho", "entregue", "cancelado", "reembolsado"];
  if (b.status) {
    if (!valid.includes(b.status)) return badRequest("Status inválido. Use: " + valid.join(", "));
    await sb.from("orders").update({ status: b.status }).eq("id", order.id);
    if (SHIP_MAP[b.status]) await sb.from("shipments").update({ status: SHIP_MAP[b.status] }).eq("order_id", order.id);
    if (b.status === "pago") await sb.from("payments").update({ status: "aprovado", paid_at: new Date().toISOString() }).eq("order_id", order.id);
  }
  if (b.payment_status && ["pendente", "aprovado", "recusado", "estornado"].includes(b.payment_status)) {
    await sb.from("payments").update({ status: b.payment_status, paid_at: b.payment_status === "aprovado" ? new Date().toISOString() : null }).eq("order_id", order.id);
  }
  const { data } = await sb.from("orders").select("id,order_number,status").eq("id", order.id).single();
  return ok({ order: data });
}
