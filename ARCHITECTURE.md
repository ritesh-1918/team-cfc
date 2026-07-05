# Architecture

## Single-Process Next.js

```
Browser → Next.js API Routes → Supabase (PostgreSQL)
                   ↓
              NVIDIA NIM API (LLM extraction)
```

## AI Pipeline

```
Citizen text
     ↓
chatCompletion() → NVIDIA meta/llama-3.1-8b-instruct
     ↓
ExtractedSubmission { category, ward, lat, lng, sentiment, urgency, summary }
     ↓
Stored in submissions table
     ↓
refreshInsights() → GROUP BY category + ward → clusters table
```

## Clustering (SQL)

No embeddings. Pure SQL aggregation:
```sql
SELECT category, ward, COUNT(*) FROM submissions GROUP BY category, ward
```

Priority score = count + highUrgency * 0.5

## Recommendation Generation

Top 5 clusters → prompt NVIDIA NIM → ranked JSON → recommendations table
