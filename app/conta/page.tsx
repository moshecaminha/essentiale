import Link from "next/link";
import { Package, MapPin, ChevronRight } from "lucide-react";
import { getCurrentCustomer } from "@/lib/customer";
import { supabaseServer } from "@/lib/supabaseServer";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Conta() {
  const { customer } = await getCurrentCustomer();
  if (!customer) return null;
  const sb = supabaseServer();
  const { count } = await sb.from("orders").select("*", { count: "exact", head: true }).eq("customer_id", customer.id);

  return (
    <>
      <h1>Olá, {customer.full_name?.split(" ")[0]}</h1>
      <p className="acc-sub">Bem-vinda à sua conta Essentiale. Aqui você acompanha pedidos e seus dados.</p>

      <div className="acc-cards">
        <Link href="/conta/pedidos" className="acc-card">
          <Package size={20} />
          <div><strong>Meus pedidos</strong><span>{count ?? 0} pedido(s)</span></div>
          <ChevronRight size={18} />
        </Link>
        <div className="acc-card static">
          <MapPin size={20} />
          <div>
            <strong>Endereço</strong>
            <span>{customer.street ? `${customer.street}, ${customer.number ?? ""} — ${customer.city ?? ""}/${customer.uf ?? ""}` : "Cadastrado no próximo pedido"}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="eyebrow">Seus dados</div>
        <p style={{ marginTop: 8 }}><strong>{customer.full_name}</strong></p>
        {customer.email && <p className="cell-muted">{customer.email}</p>}
        {customer.phone && <p className="cell-muted">{customer.phone}</p>}
      </div>
    </>
  );
}
