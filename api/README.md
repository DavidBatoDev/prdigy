# Prodigi Work Hub API

Express.js backend for Prodigi Work Hub, built to run on Vercel serverless (development) and Cloud Run (production).

## Features

- 🔐 **Supabase Authentication** - JWT-based auth with RLS enforcement
- 🎭 **Persona-based Authorization** - Client, Freelancer, Consultant, Admin roles
- 📦 **Portable Architecture** - Vercel serverless ↔ Cloud Run
- 🗃️ **Database Migrations** - Version-controlled schema via Supabase CLI
- 🛡️ **Row-Level Security** - Granular data access per persona

## Prerequisites

- Node.js >= 20.16.0
- npm >= 10.8.1
- Supabase CLI (installed as dev dependency)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Link to Supabase Project

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
```

### 4. Apply Database Migrations

```bash
npm run db:push
```

## Development

### Run Locally (Cloud Run mode)

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Run on Vercel (Serverless mode)

```bash
vercel dev
```

## API Routes

### Auth
- `POST /api/auth/onboarding` - Set initial persona after registration
- `PATCH /api/auth/persona` - Switch active persona

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project (Client only)
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project
- `POST /api/projects/:id/assign-consultant` - Assign consultant (Admin only)

### Payments
- `GET /api/payments/project/:projectId` - List payment checkpoints
- `POST /api/payments` - Create payment checkpoint (Consultant/Admin)
- `PATCH /api/payments/:id/complete` - Mark payment completed

### Admin
- `GET /api/admin/consultants/pending` - Pending consultant verifications
- `POST /api/admin/consultants/:id/verify` - Verify consultant
- `GET /api/admin/projects` - List all projects
- `GET /api/admin/users` - List all users

### Users
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update current user profile
- `GET /api/users/:id` - Get user by ID

## Database Migrations

### Create New Migration

```bash
npm run db:migration migration_name
```

### Apply Migrations

```bash
npm run db:push
```

### Reset Database (caution!)

```bash
npm run db:reset
```

## Deployment

### Vercel (Current)

```bash
vercel --prod
```

### Cloud Run (Future)

1. Build Docker image:
```bash
docker build -t prodigi-api .
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy prodigi-api --image prodigi-api --platform managed
```

## Architecture

```
api/
├── src/
│   ├── app.js              # Express app (no listen)
│   ├── index.js            # Cloud Run entry (with listen)
│   ├── lib/
│   │   └── supabase.js     # Supabase clients
│   ├── middleware/
│   │   └── auth.js         # JWT verification & persona checks
│   └── routes/
│       ├── auth.js         # Auth routes
│       ├── projects.js     # Project CRUD
│       ├── payments.js     # Payment checkpoints
│       ├── admin.js        # Admin operations
│       └── users.js        # User profiles
├── api/
│   └── index.js            # Vercel serverless entry
├── supabase/
│   ├── config.toml         # Supabase CLI config
│   └── migrations/         # SQL migrations
└── vercel.json             # Vercel configuration
```

## Environment Switching

The API automatically detects the environment:

- **Vercel**: Uses serverless export (`module.exports = app`)
- **Cloud Run**: Uses `app.listen(PORT)`

No code changes needed when switching deployment targets.
