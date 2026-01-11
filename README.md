# 🎓 Noetium - Ο Έξυπνος Βοηθός για τα Μαθήματά σου

AI-powered tutoring system for Greek secondary education, based on official Greek textbooks.

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Auth**: Supabase Auth
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: Claude (Anthropic) + OpenAI Embeddings
- **Hosting**: Vercel

## Setup

### 1. Clone and Install

```bash
cd noetium-app
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for API routes)
- `OPENAI_API_KEY` - OpenAI API key (for embeddings)
- `ANTHROPIC_API_KEY` - Anthropic API key (for Claude)

### 3. Supabase Setup

#### Enable Email Auth
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Email provider
3. Configure email templates (optional)

#### Enable Google OAuth (optional)
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add Google OAuth credentials
4. Add redirect URL: `https://your-domain.com/auth/callback`

#### Database
The `documents` table and `match_documents` function should already exist from corpus setup.

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/noetium-app.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in Vercel dashboard
4. Deploy!

### 3. Custom Domain

1. Go to Vercel Project → Settings → Domains
2. Add `noetium.ai`
3. Configure DNS at your domain registrar:
   - Add A record pointing to Vercel's IP
   - Or add CNAME record pointing to `cname.vercel-dns.com`

## Project Structure

```
noetium-app/
├── app/
│   ├── api/chat/          # AI chat endpoint
│   ├── auth/callback/     # OAuth callback
│   ├── chat/              # Main chat interface
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/
│   └── ChatInterface.tsx  # Chat UI component
├── lib/
│   └── supabase/          # Supabase client utilities
├── middleware.ts          # Auth middleware
└── ...config files
```

## Features

- 🔐 User authentication (email + Google OAuth)
- 💬 Chat interface with conversation history
- 📚 Subject filtering (Φυσική, Μαθηματικά, Χημεία, etc.)
- 🔍 Query expansion for better search
- 🎯 Context-aware responses
- 📖 Source citations from textbooks
- 🌙 Dark mode support
- 📱 Responsive design

## License

MIT
