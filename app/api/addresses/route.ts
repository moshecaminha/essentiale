import { NextResponse } from "next/server";
import { supabaseAuth } from "@/lib/supabaseAuth";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: { user } } = await supabaseAuth().auth.getUser();
  if (!user) return NextResponse.json({ addresses: [], phone: null });
  const sb = supabaseServer();
  const { data: c } = await sb.from("customers").select("id,phone").eq("auth_user_id", user.id).maybeSingle();
  if (!c) return NextResponse.json({ addresses: [], phone: null });
  const { data } = await sb.from("addresses").select("*").eq("customer_id", c.id)
    .order("is_default", { ascending: false }).order("created_at", { ascending: false });
  return NextResponse.json({ addresses: data ?? [], phone: c.phone ?? null });
}
