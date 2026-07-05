# CivicPulse — Citizen Voice for MPs

AI platform for citizen feedback and development prioritization.

## Demo Flow

1. Citizen visits `/` → submits text or voice
2. NVIDIA NIM extracts: category, ward, sentiment, urgency
3. Stored in Supabase
4. Clusters auto-computed (GROUP BY category + ward)
5. MP visits `/dashboard` → sees priorities + generates AI recommendations

## Run Locally

```bash
cd frontend
pnpm install
pnpm dev
```

Open http://localhost:3000

## Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind, shadcn/ui
- **Backend**: Next.js API routes
- **DB**: Supabase (PostgreSQL)
- **AI**: NVIDIA NIM (`meta/llama-3.1-8b-instruct`)

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/submissions` | Submit citizen feedback + AI extract |
| GET | `/api/submissions` | List all submissions |
| GET | `/api/insights` | Live clusters + category breakdown |
| POST | `/api/recommendations` | Generate AI project recommendations |
| GET | `/api/recommendations` | Fetch stored recommendations |
