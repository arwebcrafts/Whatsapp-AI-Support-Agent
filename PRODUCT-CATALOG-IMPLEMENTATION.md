# 📦 Product Catalog System - Implementation Guide

## ✅ What Has Been Implemented

### 1. Database Schema
- **File Created:** `product-catalog-migration.sql`
- **Prisma Schema Updated:** `prisma/schema.prisma`
- **Product Model Added** with fields:
  - Product info: name, description, price, originalPrice, currency, SKU
  - Details: category, brand, images (JSON), variants (JSON), features
  - Availability: inStock, stockQuantity, stockStatus
  - Source: sourceUrl, sourceType, lastSyncedAt
  - Relations: userId, agentId (optional)

### 2. Enhanced Product Scraper
- **File Created:** `lib/product-scraper.ts`
- **Extraction Methods:**
  1. **Schema.org JSON-LD** (most reliable) - extracts from structured data
  2. **OpenGraph Meta Tags** - extracts from og:product tags
  3. **Microdata** - older HTML5 microdata format
  4. **Common HTML Patterns** - fallback CSS selector-based extraction

- **Data Extracted:**
  - ✅ Product name
  - ✅ Description
  - ✅ Price & original price (for discounts)
  - ✅ Currency
  - ✅ Images (up to 10, deduplicated)
  - ✅ Brand
  - ✅ Category
  - ✅ SKU
  - ✅ Stock status
  - ✅ Variants
  - ✅ Features

### 3. API Endpoints Created

#### `/api/products` (GET, POST)
- **GET:** List all products for user (with filters by agent, category)
- **POST:** Create manual product entry

#### `/api/products/scrape` (POST)
- Scrape product from URL
- Auto-detect duplicate products
- Link to agent (optional)
- Generate product summary for knowledge base

#### `/api/products/[id]` (GET, PATCH, DELETE)
- Get single product
- Update product details
- Delete product

### 4. Features Implemented
- ✅ Duplicate detection (won't scrape same URL twice)
- ✅ Agent association (products can belong to specific agents)
- ✅ Image URL normalization (converts relative to absolute)
- ✅ Price validation
- ✅ Stock status tracking
- ✅ Multi-currency support
- ✅ Variant tracking (sizes, colors, etc.)
- ✅ Auto-generated product summaries

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Run Database Migration

**Using Railway CLI:**
```bash
# Connect to your MySQL database
railway connect mysql

# Paste and run the entire SQL from product-catalog-migration.sql
# Or run it directly:
railway run mysql -u root -p < product-catalog-migration.sql
```

**Verify Migration:**
```sql
SHOW TABLES LIKE 'products';
DESCRIBE products;
SELECT COUNT(*) FROM products;
```

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

This updates the Prisma client with the new Product model.

### Step 3: Test Product Scraping

**Test with cURL:**
```bash
# Scrape a product
curl -X POST http://localhost:3000/api/products/scrape \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "url": "https://example.com/product/iphone-15",
    "agentId": "your-agent-id-here"
  }'
```

**Expected Response:**
```json
{
  "product": {
    "id": "...",
    "name": "iPhone 15",
    "description": "...",
    "price": 999,
    "currency": "USD",
    "images": ["https://..."],
    "inStock": true
  },
  "alreadyExists": false,
  "message": "Product 'iPhone 15' successfully scraped and added to your catalog!"
}
```

---

## 🎨 NEXT STEPS: Adding Products Tab UI

### What Still Needs to be Done:

1. **Update Knowledge Base Page** (`app/dashboard/knowledge/page.tsx`)
   - Add "Products" tab to the existing tabs
   - Create product scraping form
   - Create product list/grid view
   - Add edit/delete functionality
   - Display product images, prices, descriptions

2. **UI Components Needed:**
   ```tsx
   <TabsTrigger value="products">
     <ShoppingBag className="h-4 w-4 mr-2" />
     Products
   </TabsTrigger>

   <TabsContent value="products">
     {/* Product scraping form */}
     {/* Product grid/list */}
   </TabsContent>
   ```

3. **Features to Include:**
   - URL input + "Scrape Product" button
   - Loading states during scraping
   - Product cards showing:
     * Product image
     * Name, brand, category
     * Price (with original price strikethrough if on sale)
     * Stock status
     * Edit/delete buttons
   - Filter by category
   - Search by name
   - Bulk actions (optional)

---

## 💡 AI RESPONSE LENGTH SETTINGS - MY RECOMMENDATIONS

### Current State:
The AI currently generates responses based on context and conversation flow, with no hard limits.

### Should You Add Response Length Control?

**My Recommendation: YES, but with these considerations:**

### ✅ GOOD Approach:

**Option 1: Conversation-Level Setting (BEST)**
```typescript
// In agent settings
responseStyle: {
  length: 'concise' | 'balanced' | 'detailed',
  // concise: 20-50 words
  // balanced: 50-150 words (default)
  // detailed: 150-300 words
}
```

**Why this works:**
- Simple for users to understand
- Flexible enough for different use cases
- AI can adapt based on question complexity
- Prevents awkward cutoffs mid-sentence

**Option 2: Dynamic Based on Question Type**
```typescript
// AI automatically adjusts:
- Simple greeting: 10-20 words
- Pricing question: 30-50 words
- Product explanation: 100-200 words
- Comparison: 150-300 words
```

**Why this works:**
- No user configuration needed
- Natural conversation flow
- Context-aware responses

### ❌ BAD Approaches:

**Don't Do: Hard Word Limits**
```typescript
// BAD - breaks mid-sentence
maxWords: 30 // "Our product costs $99 and comes with free shipping. It's available in three col..."
```

**Don't Do: Character Limits**
```typescript
// BAD - cuts off at random points
maxChars: 160 // Like SMS - terrible UX
```

### 🎯 MY SPECIFIC RECOMMENDATION:

**Implement a 3-tier system in Agent Settings:**

```typescript
// Add to Agent model
responsePreference: {
  style: 'brief' | 'moderate' | 'comprehensive',
  targetWordRange: {
    brief: { min: 15, max: 60, target: 30 },
    moderate: { min: 40, max: 150, target: 80 },
    comprehensive: { min: 100, max: 400, target: 200 }
  }
}
```

**System Prompt Addition:**
```typescript
const lengthGuidelines = {
  brief: "Keep responses concise (20-50 words). Be direct and to the point.",
  moderate: "Provide balanced responses (50-150 words). Include key details but stay focused.",
  comprehensive: "Give detailed, thorough responses (150-300 words). Explain fully with examples."
};

systemPrompt += `\n\nRESPONSE LENGTH: ${lengthGuidelines[agent.responsePreference.style]}`;
```

**UI in Agent Settings:**
```tsx
<Label>Response Length Preference</Label>
<Select value={responseStyle} onChange={setResponseStyle}>
  <option value="brief">Brief (30-60 words) - Quick answers</option>
  <option value="moderate">Moderate (80-150 words) - Balanced detail [Default]</option>
  <option value="comprehensive">Comprehensive (200-400 words) - Full explanations</option>
</Select>
```

### ⚠️ Important Considerations:

1. **Don't enforce hard limits** - use them as guidelines in the system prompt
2. **AI should be allowed to exceed limits** for complex questions
3. **Test with real conversations** - see what feels natural
4. **Measure by tokens, not words** - more accurate for API costs
5. **Add override for urgent/important messages** - safety info should never be cut short

### 📊 Cost Impact:

```
Brief: ~100 tokens per response
Moderate: ~250 tokens per response
Comprehensive: ~500 tokens per response

With 2,000 messages/month:
- Brief: 200,000 tokens/month = ~$0.10
- Moderate: 500,000 tokens/month = ~$0.25
- Comprehensive: 1,000,000 tokens/month = ~$0.50

(Using GPT-4o-mini prices)
```

### 🎯 Bottom Line:

**YES, implement it as a 3-tier preference system, NOT as a hard limit.**

Users appreciate control, but the AI should be smart enough to break its own rules when necessary (like detailed product comparisons or safety information).

---

## 🚀 Deployment Checklist

- [x] Create database migration SQL
- [x] Update Prisma schema
- [x] Create product scraper library
- [x] Create API endpoints (GET, POST, PATCH, DELETE)
- [x] Add duplicate detection
- [x] Add agent association
- [ ] **TODO: Update knowledge base UI with Products tab**
- [ ] **TODO: Test product scraping with real URLs**
- [ ] **TODO: Add AI response length settings to agent config**

---

## 📝 Example Product URLs to Test

**E-commerce Sites with Good Structured Data:**
- Amazon: https://www.amazon.com/dp/B0XXXXXX
- Shopify stores: Most have Schema.org markup
- WooCommerce: Usually has OpenGraph tags
- BigCommerce: Good Schema.org support

**Test with These:**
```bash
# iPhone (Apple)
https://www.apple.com/shop/buy-iphone/iphone-15

# Any Shopify store product
https://yourstore.myshopify.com/products/product-name

# Amazon product
https://www.amazon.com/iPhone-15-128GB-Black/dp/B0XXXXXX
```

---

##🛍️ How It Works

1. **User adds product URL** in Products tab
2. **Scraper fetches the page** and tries 4 extraction methods
3. **Product data saved to database** with all details
4. **AI agent can now reference products** in conversations
5. **Product appears in catalog** with images, price, stock status

**Future Integration:**
- Shopify OAuth (auto-sync entire catalog)
- WooCommerce REST API
- Manual CSV import
- Webhook updates when prices change

---

