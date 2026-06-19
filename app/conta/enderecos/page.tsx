import { MapPin, Star, Trash2 } from "lucide-react";
import { getCurrentCustomer } from "@/lib/customer";
import { supabaseServer } from "@/lib/supabaseServer";
import { addAddress, deleteAddress, setDefaultAddress } from "./actions";

export const dynamic = "force-dynamic";

type Addr = { id: string; label: string | null; cep: string | null; street: string | null; number: string | null; complement: string | null; district: string | null; city: string | null; uf: string | null; is_default: boolean };

export default async function Enderecos() {
  const { customer } = await getCurrentCustomer();
  if (!customer) return null;
  const sb = supabaseServer();
  const { data } = await sb.from("addresses").select("*").eq("customer_id", customer.id)
    .order("is_default", { ascending: false }).order("created_at", { ascending: false });
  const list = (data as Addr[]) ?? [];

  return (
    <>
      <h1>Meus endereços</h1>
      <p className="acc-sub">Salve seus endereços com um nome (Casa, Trabalho...) para comprar mais rápido — sem digitar tudo de novo.</p>

      {list.length > 0 && (
        <div className="addr-list" style={{ marginBottom: 22 }}>
          {list.map((x) => (
            <div className={`addr-card static ${x.is_default ? "on" : ""}`} key={x.id}>
              <span className="addr-check"><MapPin size={14} /></span>
              <span className="addr-body">
                <strong>{x.label || "Endereço"}{x.is_default ? " · padrão" : ""}</strong>
                <span className="cell-muted">{x.street}{x.number ? ", " + x.number : ""}{x.district ? " — " + x.district : ""}{x.city ? ", " + x.city : ""}{x.uf ? "/" + x.uf : ""} · {x.cep}</span>
              </span>
              <span className="addr-acts">
                {!x.is_default && (
                  <form action={setDefaultAddress}><input type="hidden" name="id" value={x.id} /><button className="adm-btn ghost sm" title="Definir como padrão"><Star size={13} /></button></form>
                )}
                <form action={deleteAddress}><input type="hidden" name="id" value={x.id} /><button className="adm-btn danger sm" title="Remover"><Trash2 size={13} /></button></form>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="card stack">
        <h3 className="card-title">Adicionar endereço</h3>
        <form action={addAddress} className="stack">
          <div className="field"><label>Nome do endereço (ex: Casa, Trabalho)</label><input name="label" placeholder="Casa" /></div>
          <div className="form-grid">
            <div className="field"><label>CEP</label><input name="cep" placeholder="00000-000" /></div>
            <div className="field"><label>UF</label><input name="uf" maxLength={2} placeholder="PE" /></div>
            <div className="field full"><label>Rua</label><input name="street" /></div>
            <div className="field"><label>Número</label><input name="number" /></div>
            <div className="field"><label>Complemento</label><input name="complement" /></div>
            <div className="field"><label>Bairro</label><input name="district" /></div>
            <div className="field"><label>Cidade</label><input name="city" /></div>
          </div>
          <div><button type="submit" className="adm-btn">Salvar endereço</button></div>
        </form>
      </div>
    </>
  );
}
