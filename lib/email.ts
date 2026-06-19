// Envio de e-mail via Resend. Se RESEND_API_KEY não estiver configurada,
// a função não faz nada (não quebra o fluxo) — basta ligar depois.
type OrderEmail = {
  to: string;
  customerName: string;
  orderNumber: number;
  items: { name: string; qty: number; total: number }[];
  total: number;
  method: string;
};

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export async function sendOrderConfirmation(o: OrderEmail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Essentiale <pedidos@essentialefragrance.com.br>";
  if (!key || !o.to) return false;

  const linhas = o.items.map((i) => `<tr><td>${i.qty}x ${i.name}</td><td style="text-align:right">${brl(i.total)}</td></tr>`).join("");
  const html = `
    <div style="font-family:Arial,sans-serif;color:#2E352B;max-width:520px;margin:auto">
      <h2 style="color:#5E7357">Recebemos seu pedido #${o.orderNumber}</h2>
      <p>Olá, ${o.customerName}! Obrigada por comprar com a Essentiale.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${linhas}
        <tr><td style="padding-top:10px;font-weight:bold">Total</td><td style="padding-top:10px;text-align:right;font-weight:bold">${brl(o.total)}</td></tr>
      </table>
      <p>Forma de pagamento: ${o.method}.</p>
      <p>Em breve confirmaremos o pagamento e prepararemos seu envio. Você acompanha tudo na sua conta.</p>
      <p style="color:#9AA396;font-size:12px">Essentiale Fragrance · Recife/PE</p>
    </div>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: o.to, subject: `Pedido #${o.orderNumber} recebido — Essentiale`, html }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
