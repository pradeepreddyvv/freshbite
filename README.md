# 🍽️ FreshBite — Freshness-First Dish Reviews

> **"Quality changes daily. See only what matters today."**

FreshBite is a production-ready web application that revolutionizes how people review dishes at restaurants by showing **only time-windowed, fresh reviews**. Built as a complete MVP with V2-ready architecture.

---

## 🎯 Project Goal

Build a web app where users can review **specific dishes at specific restaurants**, but the UI displays **ONLY the most recent 5 days of reviews** by default.

**Why?** Dish quality changes daily based on:
- Chef shifts and skill levels
- Fresh vs. reused ingredients (oil, spices)
- Time of day and meal preparation
- Kitchen management changes

**Solution:** Store all historical reviews, but surface only fresh data in the UI.

---

## ✨ Features

### MVP (Current)
- ✅ **Dish-specific reviews** at restaurant locations (DishAtRestaurant entity)
- ✅ **Time-windowed queries** (24h, 48h, 5d)
- ✅ **Risk labels** (🟢 Good, 🟡 Mixed, 🔴 Risky, ⚪ No data)
- ✅ **Real-time stats** (avg rating, review count)
- ✅ **Add reviews** with server-generated UTC timestamps
- ✅ **Responsive UI** with Tailwind CSS
- ✅ **SSR-first** Next.js App Router architecture
- ✅ **Production-ready** PostgreSQL schema with proper indexes

### V2 Extensions (Architecture Ready, Stubs Included)
- 🔜 **Evidence-based chat** (RAG over time-windowed reviews with citations)
- 🔜 **Alert subscriptions** (notify when quality drops)
- 🔜 **Meal slot awareness** (breakfast/lunch/dinner breakdowns)
- 🔜 **Time-of-day filtering** (show only lunch reviews)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Vercel)                      │
│  Next.js 14 (App Router) + TypeScript + Tailwind CSS        │
│                                                              │
│  Pages:                                                      │
│  • /                  → Homepage (browse dishes)             │
│  • /dish/[id]         → Dish page (reviews + stats + form)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Next.js API)                     │
│                                                              │
│  Routes:                                                     │
│  • GET  /api/dish/[id]/reviews?window=5d                    │
│  • POST /api/dish/[id]/reviews                              │
│  • GET  /api/dish/[id]/summary?window=24h                   │
│  • POST /api/chat           (stub - V2)                     │
│  • POST /api/alerts/run     (stub - V2)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               Database (Neon PostgreSQL)                     │
│                      Prisma ORM                              │
│                                                              │
│  Tables:                                                     │
│  • Restaurant                                                │
│  • Dish                                                      │
│  • DishAtRestaurant    (first-class entity)                 │
│  • Review              (append-only, never deleted)          │
│  • AlertSubscription   (stub for V2)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Data Model

### Core Entities

**DishAtRestaurant** (Why it matters)
- "Chicken Biryani" at Restaurant A ≠ same dish at Restaurant B
- Enables per-location freshness tracking
- First-class entity for reviews and alerts

**Review** (Append-only log)
- Never deleted (freshness enforced by queries, not deletes)
- `createdAt` in UTC
- `mealSlot` nullable (V2 feature)

### Critical Index
```sql
-- Optimized for time-window queries
CREATE INDEX idx_review_dish_time ON Review(dishAtRestaurantId, createdAt DESC);
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon free tier)
- npm or yarn

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd freshbite
npm install
```

### 2. Set Up Database
```bash
# Create .env file
cp .env.example .env

# Edit .env and add your DATABASE_URL:
# DATABASE_URL="postgresql://user:password@host:5432/freshbite?sslmode=require"
```

### 3. Run Migrations & Seed
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed demo data
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📊 Testing Checklist

After seeding, verify the following:

### Freshness Logic
- [ ] Homepage shows the seeded dish
- [ ] Dish page displays **7 recent reviews** (within last 5 days)
- [ ] **Old reviews (>5 days) are hidden** from the feed
- [ ] Stats reflect only the recent reviews

### Risk Label
- [ ] Risk badge shows correct status based on 24h window
- [ ] Changes based on recent review quality
- [ ] "Not enough data" when < 3 reviews

### Review Submission
- [ ] Can post new review with 1-5 rating
- [ ] Review appears immediately in feed
- [ ] Stats update correctly
- [ ] Server-generated timestamp (check DB)

### API Endpoints
```bash
# Get reviews (5 day window)
curl http://localhost:3000/api/dish/[ID]/reviews?window=5d

# Get summary (24h window)
curl http://localhost:3000/api/dish/[ID]/summary?window=24h

# Post review
curl -X POST http://localhost:3000/api/dish/[ID]/reviews \
  -H "Content-Type: application/json" \
  -d '{"rating": 5, "text": "Amazing!"}'

# Chat stub
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"dishAtRestaurantId": "[ID]", "question": "How is it?", "window": "24h"}'
```

---

## 🌐 Deployment (Vercel + Neon)

### 1. Create Neon Database
1. Go to [neon.tech](https://neon.tech)
2. Create free PostgreSQL database
3. Copy connection string

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# DATABASE_URL=<your-neon-connection-string>
# NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

### 3. Run Migrations in Production
```bash
# Generate Prisma client in production
vercel env pull .env.production
npm run db:push
npm run db:seed
```

### 4. Configure GitHub Actions (Optional)

**Required Secrets:**
- `SITE_URL` - Your deployed app URL
- `ALERTS_SECRET_TOKEN` - Random secure token

Add in GitHub repo → Settings → Secrets

---

## 🔧 Project Structure

```
freshbite/
├── app/
│   ├── api/                  # API routes
│   │   ├── dish/[id]/
│   │   │   ├── reviews/
│   │   │   │   └── route.ts  # GET/POST reviews
│   │   │   └── summary/
│   │   │       └── route.ts  # GET summary + risk
│   │   ├── chat/
│   │   │   └── route.ts      # POST chat (stub)
│   │   └── alerts/
│   │       └── run/
│   │           └── route.ts  # POST alerts (stub)
│   ├── dish/[id]/
│   │   └── page.tsx          # Dish detail page
│   ├── layout.tsx
│   ├── page.tsx              # Homepage
│   ├── globals.css
│   └── not-found.tsx
├── components/
│   ├── ChatPanel.tsx
│   ├── DishHeader.tsx
│   ├── ReviewCard.tsx
│   ├── ReviewFeed.tsx
│   ├── ReviewForm.tsx
│   ├── RiskBadge.tsx
│   └── StatsPanel.tsx
├── lib/
│   ├── format-time.ts        # Relative time formatting
│   ├── prisma.ts             # Prisma client singleton
│   ├── risk-label.ts         # Risk calculation logic
│   └── time-window.ts        # Window parsing (24h/48h/5d)
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed script
├── .github/
│   └── workflows/
│       ├── ci.yml            # CI: lint + typecheck + build
│       └── alerts-cron.yml   # Hourly alerts (stub)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── .env.example
└── README.md
```

---

## 🧪 Development Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run typecheck        # TypeScript type check

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to DB (no migrations)
npm run db:migrate       # Create migration
npm run db:seed          # Seed demo data
npm run db:studio        # Open Prisma Studio
```

---

## 🎨 Design Decisions

### Why Time Windows?
- **Problem:** Old reviews mislead (chef changed, oil reused, ingredients differ)
- **Solution:** Show only recent data (5d default)
- **Impact:** Users see what's actually relevant today

### Why DishAtRestaurant?
- **Problem:** Same dish name at different locations = different quality
- **Solution:** First-class entity linking dish + restaurant
- **Impact:** Accurate per-location tracking

### Why Append-Only Reviews?
- **Problem:** Deleting old reviews loses historical context
- **Solution:** Store everything, filter at query time
- **Impact:** Can analyze trends, add ML later

### Why Risk Labels?
- **Problem:** Users don't have time to read all reviews
- **Solution:** Color-coded summary (Good/Mixed/Risky)
- **Impact:** Instant decision-making

---

## 📈 V2 Roadmap

### Evidence-Based Chat
- RAG over time-windowed reviews
- Answer questions with citations
- Example: "Is it spicy?" → Shows relevant review quotes

### Alerts & Notifications
- Subscribe to dishes
- Email/SMS when quality drops
- Configurable thresholds

### Meal Slot Intelligence
- Derive breakfast/lunch/dinner from timestamp + timezone
- Filter reviews by time of day
- "Show me only lunch reviews"

### Advanced Analytics
- Quality trends over time
- Chef/shift correlation
- Predictive risk scoring

---

## 🤝 Contributing

Contributions welcome! Key areas:
1. **UI/UX improvements** (mobile responsiveness, accessibility)
2. **Performance optimizations** (caching, edge functions)
3. **V2 feature implementations** (chat, alerts, meal slots)
4. **Testing** (unit tests, E2E tests)

---

## 📝 License

MIT License - See LICENSE file

---

## 🙏 Acknowledgments

Built with:
- [Next.js 14](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zod](https://zod.dev/)
- [Vercel](https://vercel.com/)
- [Neon](https://neon.tech/)

---

## 📞 Support

Questions or issues?
- Open a GitHub issue
- Check the [Testing Checklist](#-testing-checklist)
- Review [Deployment Docs](#-deployment-vercel--neon)

---

**Built with ❤️ for better food decisions**
