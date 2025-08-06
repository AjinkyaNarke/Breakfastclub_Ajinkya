# Recraft API Setup for Image Generation

## 🔑 Required Configuration

To enable image generation, you need to configure the Recraft API key in your Supabase project.

### Step 1: Get Recraft API Key

1. Go to [Recraft.ai](https://recraft.ai)
2. Sign up or log in to your account
3. Navigate to API settings
4. Generate or copy your API key

### Step 2: Configure in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ckvwevclnhtcnsdmashv
2. Click on **Settings** in the left sidebar
3. Click on **Edge Functions**
4. Go to **Environment Variables** tab
5. Click **Add Variable**
6. Set:
   - **Name**: `RECRAFT_API_KEY`
   - **Value**: Your Recraft API key (e.g., `recraft_v1_abcd1234...`)
7. Click **Save**

### Step 3: Test the Setup

1. Go to Admin Panel → Ingredients
2. Click **"Test Setup"** button
3. Should now show: `Columns: ✅ | Edge Function: ✅`

### Step 4: Generate Images

**Individual Images:**
- Click on any gray placeholder image in ingredient cards
- Image will generate in ~10 seconds

**Batch Generation:**
- Click **"Generate Images"** button
- Select multiple ingredients
- Click **"Generate Images (X)"**
- Watch real-time progress

## 💰 Cost Information

- **Cost per image**: ~€0.01 (1 cent)
- **Image size**: 256x256px (optimized for restaurant operations)
- **Monthly budget**: €10 (tracked automatically in AI credits system)
- **Estimated capacity**: ~1000 images per month

## 🎨 Smart Image Types

The system automatically detects ingredient types and generates appropriate images:

### **Raw Ingredients** (vegetables, proteins, oils)
- **Style**: Product photography with white background
- **Examples**: Tomatoes, chicken breast, olive oil
- **Prompt**: `"product photography, white background, professional, clean"`

### **Spices & Herbs** (seasonings, dried herbs)
- **Style**: Ingredient photography with clear detail
- **Examples**: Paprika, oregano, black pepper
- **Prompt**: `"ingredient photography, clear detail, professional lighting"`

### **Prepared Dishes** (sauces, prepared foods)
- **Style**: Restaurant-quality food photography
- **Examples**: Hummus, curry paste, tomato sauce
- **Prompt**: `"restaurant quality food photography, appetizing presentation"`

## 🔧 Troubleshooting

### Error: "RECRAFT_API_KEY not configured"
- Follow Step 2 above to add the API key
- Make sure the variable name is exactly `RECRAFT_API_KEY`
- Wait 1-2 minutes after saving for changes to take effect

### Error: "Recraft API error (401)"
- Your API key is invalid or expired
- Get a new API key from Recraft.ai
- Update the environment variable

### Error: "Recraft API error (429)"
- You've hit the rate limit
- Wait a few minutes before trying again
- Consider upgrading your Recraft plan if needed

### Error: "Storage upload error"
- Check that the `images` bucket exists in Supabase Storage
- Verify storage permissions are correctly configured

## ✅ Verification

After setup, you should be able to:
- [x] Test setup shows all green checkmarks
- [x] Individual images generate in ~10 seconds
- [x] Batch generation works with progress tracking
- [x] Images appear in ingredient cards automatically
- [x] AI credits are being tracked and deducted
- [x] Different ingredient types get appropriate image styles

## 🎉 Ready for Production!

Once configured, the image generation system will:
- Automatically generate professional images for all ingredients
- Provide visual aids for efficient restaurant operations
- Track costs and stay within budget
- Enhance UX with fast, beautiful images

**Happy cooking!** 🍽️✨