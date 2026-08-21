# ViralLab

ViralLab is an AI-powered content intelligence workspace designed to turn real video data into actionable patterns and original content blueprints.

## Current status

The repository now contains the Phase 1 foundation from the master roadmap:

- React + Vite production UI
- Supabase authentication and RLS
- Project and normalized video data model
- YouTube discovery Edge Function
- 10 / 50 / 100 result selection
- Time-window discovery (day / week / month / year)
- Viral Score calculation in the UI
- First operational analysis pipeline that produces patterns and a content blueprint
- Cloudflare-compatible `dist` build

The master roadmap defines YouTube as the first discovery connector, followed by deeper video intelligence (FFmpeg, shot detection, ASR/OCR, Hook/CTA, Video Doctor), auto-editing, scenario generation and later TikTok expansion. fileciteturn8file2L79-L125

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Supabase setup

1. Run `supabase/schema.sql`.
2. Run `supabase/migrations/20260821_viral_discovery_foundation.sql`.
3. Configure Supabase Auth email provider and redirect URLs.
4. Deploy the Edge Functions under `supabase/functions/`.
5. Add `YOUTUBE_API_KEY` as a Supabase Edge Function secret. Never put this key in `VITE_*` variables or frontend code.

The discovery UI expects the `projects` and `videos` tables, while the analysis UI expects `analysis_runs`, `patterns`, and `blueprints`. The migration creates these tables with per-user RLS.

## Discovery flow

1. Sign in.
2. Open **کشف ویدئو**.
3. Enter a niche or keyword.
4. Choose 10, 50, or 100 videos.
5. Choose the time window.
6. Run discovery.
7. Review normalized results and Viral Scores.
8. Run **تحلیل و ساخت Blueprint**.

## Deployment

Build with:

```bash
npm run build
```

The generated `dist` directory is compatible with Cloudflare Pages/Workers deployment. Keep Supabase secrets in Supabase, not in the client bundle.

## Product quality gate

Every major capability should pass three validation rounds: functional validation, quality/adversarial validation, and production simulation. A failed gate is fixed and regression-tested before moving forward. fileciteturn8file4L225-L245
