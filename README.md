# EventX - Complete Event Management Platform

A comprehensive event management platform similar to Cvent, built with Next.js, Supabase, and Sanity.io.

## Features

### Pre-Event & Planning
- **Event Registration** - Customizable registration forms, ticketing, and payment processing
- **Venue Sourcing** - Search venues, send RFPs, and compare bids
- **Website Builder** - Create event landing pages with Sanity CMS

### Floor Plan Management
- **CAD Import** - Import .dxf floor plans
- **Interactive Editor** - Drag-and-drop booth placement with Konva
- **Real-time Inventory** - Track booth availability and sales

### Onsite Solutions
- **Check-in & Badging** - QR code scanning and badge printing
- **Lead Capture** - Scan attendee badges for exhibitors
- **Kiosk Mode** - Self-service check-in stations

### Attendee Experience
- **Agenda Builder** - Personal schedule management
- **Live Polling & Q&A** - Real-time session interaction
- **Networking** - Smart matchmaking and meeting scheduling
- **Gamification** - Points for engagement

### Post-Event
- **Surveys** - NPS scores and session feedback
- **Analytics** - Revenue reports and engagement metrics

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS, shadcn/ui, Radix UI
- **State Management**: Zustand
- **Backend/Database**: Supabase (PostgreSQL, Auth, Realtime)
- **CMS**: Sanity.io
- **Floor Plan**: React Konva, dxf-parser
- **Charts**: Recharts
- **Forms**: React Hook Form, Zod

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Sanity.io account (optional, for CMS features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/event-x.git
cd event-x
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production

# Stripe (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
```

4. Set up the database:
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Run the schema from `supabase/schema.sql`

5. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
event-x/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Protected dashboard routes
│   │   ├── auth/               # Authentication pages
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Layout components
│   │   ├── floor-plan/         # Floor plan editor
│   │   └── networking/         # Networking features
│   ├── lib/
│   │   ├── supabase/           # Supabase clients
│   │   ├── sanity/             # Sanity client & queries
│   │   └── utils.ts            # Utility functions
│   ├── hooks/                  # Custom React hooks
│   ├── store/                  # Zustand stores
│   └── types/                  # TypeScript types
├── supabase/
│   └── schema.sql              # Database schema
└── public/                     # Static assets
```

## Database Schema

The application uses the following main tables:

- **profiles** - User profiles (extends Supabase auth)
- **events** - Event details
- **venues** - Venue information
- **floorplans** - Floor plan configurations
- **booths** - Booth/exhibitor spaces
- **tickets** - Ticket types and pricing
- **registrations** - Event registrations
- **sessions** - Event sessions/agenda
- **networking_matches** - AI-powered attendee matching
- **appointments** - Meeting schedules
- **messages** - Real-time chat
- **surveys** - Post-event feedback

## Key Features Implementation

### Floor Plan Editor

The floor plan system supports:
- DXF file import using `dxf-parser`
- Interactive canvas with React Konva
- Booth drawing and editing
- Collision detection
- Real-time updates via Supabase

### Networking System

Smart matchmaking includes:
- Interest-based matching
- Optional AI/vector embeddings for semantic matching
- QR code business cards
- In-app messaging
- Meeting scheduling

### Real-time Features

Using Supabase Realtime for:
- Live booth availability
- Chat messages
- Session polls
- Check-in updates

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app is a standard Next.js application and can be deployed to:
- Netlify
- Railway
- AWS Amplify
- Docker containers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this for your own projects.

## Support

For questions or issues, please open a GitHub issue.
