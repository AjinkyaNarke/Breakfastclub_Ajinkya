# Vercel Environment Variables Setup

## Critical: Set these in Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables and add:

### Required Variables:
```
VITE_SUPABASE_URL=https://ckvwevclnhtcnsdmashv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdndldmNsbmh0Y25zZG1hc2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTc2NTgsImV4cCI6MjA2ODQzMzY1OH0.nGqUMAb2CZnVtz66Vc0kAU6nzpcT_7qrMgEi-AbqEsc
```

### Optional Variables:
```
VITE_DEEPSEEK_API_KEY=sk-15a0e1570d33797d4484dd31a62c1b2cbab061f5ab62736d4f6ddc6ca10fb443
VITE_DEEPGRAM_API_KEY=4342f4f9a73bfd6b2a6bc301ae7fcec0f299562900fb46344281ebf45805b9f
VITE_ENABLE_VOICE_FEATURES=true
VITE_ENABLE_AI_TRANSLATION=true
VITE_ENABLE_RECIPE_CACHE=true
NODE_ENV=production
```

## Steps:
1. Copy each variable name and value above
2. Paste into Vercel Environment Variables
3. Set for: Production, Preview, Development
4. Redeploy your application

## Security Note:
- The Supabase anon key is safe to expose (it's designed for client-side use)
- Other API keys should be kept secure
- Never commit real API keys to git repositories
