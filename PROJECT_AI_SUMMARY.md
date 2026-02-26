# 🧠 FreshBite AI Agent Project Summary

## Overview
FreshBite is a production-ready web app for dish reviews, built with Next.js 14, Prisma ORM, and Neon PostgreSQL. It tracks dish quality at specific restaurant locations, surfaces only recent reviews, and includes per-page analytics.

## Key Features
- Dish-specific reviews at restaurant locations
- Time-windowed queries (last 5 days)
- Risk labels (Good/Mixed/Risky)
- Real-time stats
- Per-page visit counters (unique + total views)
- Append-only review log
- Responsive UI (Tailwind CSS)
- SSR-first architecture
- Production-ready DB schema
- API endpoints for reviews, summaries, chat (stub), alerts (stub), analytics

## Data Model
- Restaurant
- Dish
- DishAtRestaurant (per-location dish entity)
- Review (append-only)
- AlertSubscription (stub)
- PageVisit (event log)
- PageVisitCounter (aggregated counters)

## Analytics
- Page views tracked via client-side tracker and API
- Unique visitors via session cookie
- Bot traffic ignored
- API: `/api/analytics/pageviews` (POST for logging, GET for counters)

## Deployment
- Vercel (frontend + API)
- Neon PostgreSQL
- Prisma ORM

## Extending the Project
- Add new API endpoints in `app/api/`
- Add new DB models in `prisma/schema.prisma`
- Add new client components in `components/`
- Analytics API is ready for dashboard or admin usage

## Contact
- Open GitHub issue for questions
