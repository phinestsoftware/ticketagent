# Ticket Agent

A React + Vite application for managing tickets from Monday.com with device logging capabilities.

## Features

- **Dashboard**: Overview of tickets, team mappings, and device logs
- **Ticket Mappings**: CRUD operations for mapping ticket types to teams
- **Device Logs**: Log management for mobile device numbers
- **Tickets**: View tickets imported from Monday.com via webhook
- **Setup**: Configure Monday.com integration settings
- **Monday.com Webhook**: Automatic ticket import via Supabase Edge Function

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn UI for components
- Supabase for database and edge functions
- React Router for navigation

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql` in your Supabase SQL editor
3. This will create the following tables:
   - `ticket_type_team_mapping`
   - `device_logs`
   - `tickets`
   - `monday_config`

### 4. Supabase Edge Function Setup

1. Install Supabase CLI: `npm install -g @supabase/cli`
2. Login to Supabase: `supabase login`
3. Initialize Supabase in your project: `supabase init`
4. Deploy the edge function:

```bash
supabase functions deploy monday-webhook
```

### 5. Monday.com Integration

1. Go to the Setup page in the application
2. Configure your Monday.com webhook URL, API token, and board ID
3. Set up a webhook in Monday.com pointing to: `https://your-supabase-project.supabase.co/functions/v1/monday-webhook`

### 6. Run the Application

```bash
npm run dev
```

## Database Schema

### ticket_type_team_mapping
Maps ticket types to responsible teams.

### device_logs
Stores log entries for mobile device numbers with different log levels.

### tickets
Stores tickets imported from Monday.com with status, priority, and team assignment.

### monday_config
Stores Monday.com integration configuration.

## API Endpoints

- **Monday.com Webhook**: `/functions/v1/monday-webhook`
  - Handles incoming webhooks from Monday.com
  - Automatically creates/updates tickets
  - Maps ticket types to teams based on configuration

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
