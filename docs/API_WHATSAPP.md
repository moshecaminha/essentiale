# API de Integração — Essentiale (v1)

API REST para o WhatsApp (oficial ou não-oficial) e automações conectarem ao site:
ler catálogo/preços, criar e atualizar pedidos, gerir clientes e campanhas, registrar
conversas e consultar o relatório de vendas.

## Base URL
```
https://essentiale.vercel.app/api/v1
```

## Autenticação
Toda requisição precisa da chave de integração, em **um** destes cabeçalhos:
```
Authorization: Bearer SUA_CHAVE
# ou
x-api-key: SUA_CHAVE
```
A chave é definida na variável de ambiente `INTEGRATION_API_KEY` (na Vercel) e entregue ao
desenvolvedor. Sem chave válida a resposta é `401 unauthorized`.

Respostas são sempre JSON. Erros seguem o formato `{ "error": "codigo", "message": "..." }`.
Valores monetários são em **centavos** (`price_cents`, `total_cents`). Aceita-se também `price`
em reais (ex: `"89.90"`) nos corpos de criação/edição.

---

## Catálogo

### GET /products
Lista produtos. Filtros (query): `q` (nome), `category` (slug ou nome), `fragrance`,
`active` (`true|false`), `wholesale` (`true|false`), `limit` (padrão 100).
```
curl -H "Authorization: Bearer SUA_CHAVE" \
  "https://essentiale.vercel.app/api/v1/products?active=true&wholesale=false"
```

### GET /products/{id}
Detalhe por `id` (uuid) ou `slug`.

### POST /products
Cria produto. Corpo:
```json
{ "name":"Vela Lavanda 200g","price":89.90,"stock_qty":20,"fragrance":"Lavanda",
  "category":"velas-aromaticas","is_wholesale":false,"description":"...","image_url":"https://..." }
```

### PATCH /products/{id}
Atualiza parcialmente (ideal para **preço/estoque** pelo WhatsApp). Envie só o que muda:
```json
{ "price_cents": 9500, "stock_qty": 12, "active": true }
```

### GET /categories  ·  GET /fragrances
Listam categorias e as fragrâncias cadastradas (para o bot oferecer opções).

---

## Pedidos

### GET /orders
Lista pedidos recentes. Filtros: `status`, `phone`, `limit`.

### GET /orders/{id}
Detalhe por `id` (uuid) ou número (`order_number`), com itens, pagamento e entrega.

### POST /orders
Cria pedido a partir do WhatsApp. O cliente é encontrado pelo telefone ou criado.
Os preços vêm do banco; `unit_price_cents` permite sobrescrever (ex: desconto do bot).
```json
{
  "customer": { "name":"Paulo Caminha","phone":"5581987593444","email":"x@y.com",
                "cep":"54440620","street":"Av Bernardo Vieira","number":"5542","city":"Recife","uf":"PE" },
  "items": [ { "slug":"difusor-de-varetas-felicita-250ml", "qty":1 } ],
  "method": "pix",
  "discount_cents": 990,
  "payment_status": "pendente",
  "channel": "whatsapp"
}
```
Resposta: `{ "order": { "order_number": 10002, "status":"aguardando_pagamento", "total_cents": 8910, ... } }`

### PATCH /orders/{id}
Atualiza status do pedido (e ajusta entrega/pagamento). 
`status`: `aguardando_pagamento, pago, em_separacao, enviado, a_caminho, entregue, cancelado, reembolsado`.
`payment_status`: `pendente, aprovado, recusado, estornado`.
```json
{ "status": "pago" }
```

---

## Clientes

### GET /customers?q=&limit=
Lista/busca clientes (nome, telefone ou e-mail).

### GET /customers/{id}
Detalhe + histórico de pedidos.

### POST /customers
Upsert por telefone (cria ou atualiza):
```json
{ "name":"Adonias Santos","phone":"5571993061031","email":"...","city":"Salvador","uf":"BA" }
```

### PATCH /customers/{id}
Atualiza dados do cliente.

---

## Campanhas

### GET /campaigns  ·  POST /campaigns  ·  PATCH /campaigns/{id}
Criar e gerir campanhas pelo WhatsApp.
`objective`: `reativacao, vip_lancamento, cross_sell, sazonal, aniversario, outro`.
`channel`: `whatsapp, email, sms`. `status`: `rascunho, agendada, ativa, encerrada, cancelada`.
```json
{ "name":"Reativação junho","objective":"reativacao","channel":"whatsapp",
  "status":"agendada","segment":"sem compra há 60 dias","message_template":"Oi {nome}! ...",
  "scheduled_at":"2026-06-25T12:00:00Z" }
```
O PATCH também aceita métricas: `sent_count, opened_count, converted_count, revenue_cents`.

---

## Comunicação (conversas)

### POST /messages
Registra uma mensagem na conversa do cliente (garante a conversa aberta).
```json
{ "phone":"5581987593444", "direction":"saida", "body":"Seu pedido foi confirmado!",
  "wa_message_id":"wamid.xxx" }
```
`direction`: `entrada` (cliente) ou `saida` (loja).

### POST /webhook/whatsapp
Endpoint para o provedor de WhatsApp enviar mensagens recebidas. Cria cliente/conversa se preciso.
```json
{ "from":"5581987593444", "name":"Paulo", "text":"Oi, quero um difusor", "wa_message_id":"wamid.xxx" }
```
Aponte o webhook da plataforma de WhatsApp para esta URL, incluindo o cabeçalho da chave.

---

## Relatório

### GET /report?days=30
Resumo de vendas: receita confirmada/aguardando, pedidos, ticket médio, novos clientes,
carrinhos abandonados, conversão, mais vendidos e vendas por dia. Útil para o admin
perguntar "como estão as vendas?" pelo WhatsApp.

## Contexto da loja

### GET /context
Retorna dados da loja + catálogo ativo (nome, preço, estoque, fragrância, categoria).
Use para "alimentar" o bot com o catálogo real, evitando que ele invente preços.

---

## Códigos de status
- `200` ok · `201` criado · `400` requisição inválida · `401` chave inválida · `404` não encontrado · `500` erro interno.

## Notas
- Telefones podem ser enviados com ou sem máscara; são normalizados para dígitos.
- O número do pedido (`order_number`) começa em 10001 e é sequencial.
- Toda escrita usa acesso de serviço no servidor; o cliente nunca expõe a chave do banco.
