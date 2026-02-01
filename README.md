# Bookd

An AI-powered receptionist platform that lets non-technical business owners create their own voice agent for appointment-based services. Built for SpartaHacks.

## What It Does

Business owners sign up, configure a custom AI voice agent (personality, greeting, voice), get a real provisioned phone number, and have the agent handle incoming calls automatically. Customer info, call data, and appointments all sync into a live dashboard.

## Tech Stack

- **Next.js 14** -- React framework with App Router for file-based routing
- **TypeScript** -- Type-safe development
- **React 18** -- UI library with lazy loading and Suspense
- **Supabase** -- PostgreSQL database, Auth (email + password), Row-Level Security, SSR cookie handling
- **Teli AI** -- Voice agent creation, phone number provisioning, call data API

## Features

- Multi-step onboarding: business info, area code selection, voice agent configuration, custom extraction fields
- Live call syncing from Teli AI into Supabase
- Dashboard with Calendar, Inbox, Leads, Analytics, and Agent configuration tabs
- URL-based routing (`/calendar`, `/inbox`, `/leads`, `/analytics`, `/agent`)
- Supabase Auth with email + password
- JSONB custom fields so any business type can track what matters to them
- Lazy-loaded tab components for fast page loads

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Teli AI](https://teli.ai) account

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/bookd.git
   cd bookd
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   TELI_API_KEY=your_teli_api_key
   ```

4. Run the schema in your Supabase SQL Editor:
   ```bash
   # Copy contents of supabase/schema.sql into the SQL Editor
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
bookd/
  app/              # Next.js App Router pages
    calendar/       # /calendar route
    inbox/          # /inbox route
    leads/          # /leads route
    analytics/      # /analytics route
    agent/          # /agent route
    login/          # /login route
    api/            # API routes (teli sync, onboarding, etc.)
  dashboard/        # Dashboard components, tabs, hooks, styles
  lib/              # Supabase clients, Teli API, helpers
  supabase/         # Database schema
```
