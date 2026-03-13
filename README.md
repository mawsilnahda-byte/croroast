# 🔥 CROroast

> Brutal AI CRO audits for Shopify & WooCommerce stores.

**Live:** https://croroast.vercel.app (à configurer)

---

## Setup

### 1. Variables d'environnement

Copier `.env.local.example` → `.env.local` et remplir :

```env
OPENAI_API_KEY=sk-...           # https://platform.openai.com/api-keys
STRIPE_SECRET_KEY=sk_live_...   # https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://croroast.vercel.app
```

### 2. Dev local

```bash
npm install
npm run dev
# → http://localhost:3000
```

### 3. Deploy Vercel

```bash
npx vercel --prod
```
Ou connecter le repo GitHub dans le dashboard Vercel.

N'oublie pas d'ajouter les variables d'environnement dans Settings → Environment Variables sur Vercel.

---

## How It Works

1. User entre une URL de page produit/landing
2. Screenshot auto via [thum.io](https://thum.io) (gratuit, sans clé)
3. GPT-4o Vision analyse la page
4. Preview gratuite : 3 points sur 10
5. Paiement $9 via Stripe → rapport complet débloqué

## Stack

- **Next.js 14** (App Router) — Vercel
- **OpenAI GPT-4o Vision** — analyse
- **thum.io** — screenshots (gratuit)
- **Stripe** — paiements ($9 one-time)
- **Tailwind CSS** — UI

## Monetisation

| Action | Revenue |
|--------|---------|
| 1 rapport complet | $9 |
| 10 rapports/jour | $90/jour |
| 100 rapports/jour | $900/jour |

Coût OpenAI par analyse : ~$0.03-0.05 → marge > 99%
