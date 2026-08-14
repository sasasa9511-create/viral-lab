# ViralLab

ViralLab is an AI-powered content and growth workspace.

## Current foundation
- React + Vite production build
- Supabase client integration point
- Demo mode when environment variables are absent
- Supabase schema for profiles and ideas with RLS
- GitHub Actions build validation
- Cloudflare Pages-compatible `dist` output

## Run
```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for real authentication.

## Supabase
Run `supabase/schema.sql` in the Supabase SQL Editor, then configure Auth email provider and redirect URLs.

## Deploy
Build with `npm run build`; deploy `dist` to Cloudflare Pages.
