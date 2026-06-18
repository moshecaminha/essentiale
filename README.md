# Essentiale · Painel de Inteligência Comercial

Painel administrativo da Essentiale Fragrance — gestão de catálogo, clientes,
pedidos e inteligência de mercado. Construído em Next.js (App Router) sobre Supabase.

Esta é a **Fase 2 (admin)**. A fundação de dados (17 tabelas, RLS, base RFM) já
está aplicada no projeto Supabase `essentiale` e o catálogo real (33 produtos)
já está populado.

## Rodar localmente

Pré-requisito: Node.js 18.18+.

```bash
npm install
cp .env.example .env.local   # se ainda não existir
npm run dev
```

Abra http://localhost:3000.

A chave pública do Supabase já vem preenchida em `.env.local`, então a tela de
**Produtos** funciona de imediato (catálogo é leitura pública).

Para o painel ler **clientes, pedidos e a base RFM** (dados protegidos por
segurança de linha), adicione a chave de serviço:

1. Supabase → Project Settings → API → `service_role` (secreta).
2. Cole em `.env.local` na variável `SUPABASE_SERVICE_ROLE_KEY`.

Nunca comite a `service_role` nem a coloque em variáveis `NEXT_PUBLIC_*`.

## Estrutura

```
app/(painel)/
  page.tsx          Visão geral (KPIs de catálogo, alertas de estoque)
  produtos/         Catálogo completo
  clientes/         CRM + segmentação RFM
  inteligencia/     (próxima fase)
  campanhas/        (próxima fase)
  pedidos/          (próxima fase)
lib/
  supabaseServer.ts Cliente Supabase no servidor
  format.ts         Formatação BRL
components/Sidebar.tsx
```

## Publicar no GitHub

```bash
# repositório já inicializado com o primeiro commit
git remote add origin https://github.com/SEU_USUARIO/essentiale-admin.git
git branch -M main
git push -u origin main
```

Se usar o GitHub CLI: `gh repo create essentiale-admin --private --source=. --push`.

## Publicar na Vercel

1. vercel.com → New Project → importe o repositório.
2. Em Environment Variables, defina:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (marque como secreta)
3. Deploy.

## Próximas fases

3. Pedidos, entregas e pagamento (Mercado Pago / Pagar.me)
4. CRM com cadastro via CEP (ViaCEP) e o painel de inteligência RFM ao vivo
5. Campanhas e WhatsApp (WhatsApp Cloud API)
6. Camada de IA: insights em linguagem natural e campanhas geradas
