# Orderflow Trade Journal

A custom trade journal built specifically for Valentini's Nasdaq Orderflow methodology, tracking the 3-element framework, A/B/C setup grading, and equity high drawdown management for prop firm preparation.

## Features

### Core Functionality
- **3-Element Checklist**: Track market state, location type, and aggression type for every trade
- **Setup Grading**: A/B/C classification based on confluence quality
- **Prism Confirmation**: Binary field for orderflow confirmation
- **Equity High Tracking**: Real-time drawdown monitoring for Apex-style prop firms

### Analytics
- Win rate breakdown by setup grade, aggression type, location, and market state
- Equity curve visualization with drawdown overlay
- **Ready to Fund** checklist with progress tracking
- Profit factor and R:R analysis

### Data Management
- Local storage (works offline)
- JSON export/import for backup
- Optional Supabase cloud sync for multi-device access

## Quick Start

### Option 1: Local Development

```bash
cd orderflow-journal
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Option 2: Deploy to Vercel

1. Push to GitHub
2. Connect to Vercel
3. Deploy (zero config needed)

## Setup Supabase (Optional)

For cloud sync across devices:

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project (free tier works fine)

### 2. Run Database Schema
- Go to SQL Editor in your Supabase dashboard
- Copy contents of `supabase-schema.sql`
- Run the query

### 3. Add Environment Variables

Create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in: Supabase Dashboard → Settings → API

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| D | Go to Dashboard |
| A | Go to Analytics |
| H | Go to History |
| S | Go to Settings |

## Ready to Fund Criteria

- 50+ trades completed
- 45%+ win rate
- 1.3+ profit factor
- Largest loss < $75
- No day worse than -$150

## Tech Stack

- React 18 + TypeScript
- Tailwind CSS
- Zustand (state management)
- Recharts (charts)
- Supabase (optional cloud sync)
- Vercel (hosting)

## License

MIT License
