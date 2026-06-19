"use client";

import { ChevronRight, MessageCircle } from "lucide-react";
import { advanceOrder } from "@/app/admin/pedidos/actions";
import { STATUS_LABEL, nextStatus } from "@/lib/orders";

export default function OrderActions({ id, status, phone, orderNumber }: { id: string; status: string; phone: string | null; orderNumber: number }) {
  const next = nextStatus(status);
  const notify = () => {
    if (!phone) return;
    const msg = `Olá! Atualização do seu pedido #${orderNumber} na Essentiale: ${STATUS_LABEL[status] ?? status}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };
  return (
    <div className="order-actions">
      {next && (
        <form action={advanceOrder}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="current" value={status} />
          <button type="submit" className="adm-btn">Avançar para: {STATUS_LABEL[next]} <ChevronRight size={15} /></button>
        </form>
      )}
      <button className="adm-btn ghost" onClick={notify} disabled={!phone} title={phone ? "" : "Cliente sem WhatsApp cadastrado"}>
        <MessageCircle size={15} /> Avisar cliente no WhatsApp
      </button>
    </div>
  );
}
