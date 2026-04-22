# Neatly Final Project

Hotel booking web application with a complete user booking flow and an agent/admin dashboard for operations and analytics.

## Live Demo

- Deployed on **Vercel**
- Production URL: [https://neatly-final-project-1.vercel.app/](https://neatly-final-project-1.vercel.app/)

## Demo Accounts (2 Roles)

### 1) Agent

- Email: `agent1@gmail.com`
- Password: `123456`
- Access: admin management and analytics dashboard

### 2) User

- Email: `customer@gmail.com`
- Password: `123456`
- Access: booking flow and customer-facing features

## Why This Project Stands Out

- Full-stack implementation using Next.js Pages Router + API routes
- Real business flow: room search, booking, payment, booking action, notifications
- Dual-mode analytics (mock/live) with role-based access control
- Integrated external services: Supabase, Stripe, Resend, OpenRouter chatbot
- Component-driven UI with reusable dashboard and form modules

## Core Features

### User Side

- Authentication (register/login)
- Search rooms and room detail pages
- Booking flow with guest info, special requests, and payment
- Booking status pages (success/failed) and booking history
- Promotion support and order update endpoints

### Agent Side

- Protected admin area (role = `agent`)
- Room and amenity management
- Promotion management
- Customer booking monitoring and details
- Analytics dashboard:
  - Room Availability
  - Booking Trends by Day
  - Revenue Trend
  - Occupancy & Guest
  - Check-in / Check-out averages
  - Website Traffic

## Tech Stack

- Frontend: Next.js 16, React 19, Tailwind CSS
- UI/Charts: Radix UI, Recharts, Lucide icons
- Backend: Next.js API routes
- Database/Auth data layer: Supabase
- Payment: Stripe
- Email: Resend
- Validation and form handling: Zod, React Hook Form

## Project Structure (High Level)

```bash
src/
  components/        # Reusable UI and feature components
  features/          # Business logic modules (service/controller/repository)
  hooks/             # Frontend data-fetching and state hooks
  lib/               # Shared libraries (fetchers, transformers, integrations)
  pages/             # Next.js pages + API routes
  utils/             # Utility helpers and mock data
```

## Environment Variables

Create `.env.local` and configure:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
OPENROUTER_API_KEY=
CONNECTION_STRING=
```

## Getting Started (Local)

### Prerequisites

- Node.js 18+ (recommended LTS)
- npm

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

## API Overview

Representative endpoints:

- Auth: `/api/auth/login`, `/api/auth/register`, `/api/auth/user`
- Booking: `/api/booking/create-order`, `/api/booking/update-payment-status`
- Admin analytics: `/api/admin/analytics/booking-trends`, `/api/admin/analytics/revenue-trend`, `/api/admin/analytics/occupancy-guest`
- Payments: `/api/stripe/create-payment-intent`, `/api/stripe/webhook`

## Notes for Reviewers / HR

- This project demonstrates both product thinking (end-to-end booking experience) and engineering depth (feature modularization, third-party integrations, and analytics data pipeline).
- Role-based access and separated feature modules make the codebase easier to scale and maintain.
