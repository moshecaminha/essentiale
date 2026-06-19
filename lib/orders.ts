export const PIPELINE = ["aguardando_pagamento", "pago", "em_separacao", "enviado", "a_caminho", "entregue"] as const;

export const STATUS_LABEL: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em separação",
  enviado: "Enviado",
  a_caminho: "A caminho",
  entregue: "Entregue",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

export const METHOD_LABEL: Record<string, string> = {
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  boleto: "Boleto",
  outro: "Outro",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
  estornado: "Estornado",
};

export function nextStatus(s: string): string | null {
  const i = PIPELINE.indexOf(s as any);
  if (i < 0 || i >= PIPELINE.length - 1) return null;
  return PIPELINE[i + 1];
}
