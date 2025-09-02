# Vercel Deployment Guide

## Environment Variables Setup

To deploy this application on Vercel, you need to configure the following environment variables in your Vercel project dashboard:

### Required Environment Variables

1. **VITE_SUPABASE_URL**
   - Your Supabase project URL
   - Example: `https://your-project-id.supabase.co`

2. **VITE_SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Found in Supabase Dashboard → Settings → API

### Optional Environment Variables

3. **VITE_DEEPSEEK_API_KEY**
   - DeepSeek API key for AI features
   - Get from DeepSeek platform

4. **VITE_DEEPGRAM_API_KEY**
   - Deepgram API key for voice features
   - Get from Deepgram console

5. **VITE_ENABLE_VOICE_FEATURES**
   - Set to `true` to enable voice features
   - Set to `false` to disable

6. **VITE_ENABLE_AI_TRANSLATION**
   - Set to `true` to enable AI translation
   - Set to `false` to disable

7. **VITE_ENABLE_RECIPE_CACHE**
   - Set to `true` to enable recipe caching
   - Set to `false` to disable

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with its corresponding value
4. Make sure to set them for all environments (Production, Preview, Development)
5. Redeploy your application after adding the variables

## GitHub Repository Setup

Make sure your `.env` file is listed in `.gitignore` to prevent sensitive keys from being committed to the repository.

## Troubleshooting

If you get "supabaseKey is required" error:
1. Verify that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel
2. Check that the variable names match exactly (case-sensitive)
3. Redeploy the application after setting the variables
4. Check Vercel function logs for detailed error messages

## Local Development

1. Copy `.env.example` to `.env`
2. Fill in your actual API keys and URLs
3. Run `npm run dev` to start development server
