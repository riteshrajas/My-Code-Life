<div align="center"><strong>My Life Code App</strong></div>
<div align="center">A minimal, dark, animated dashboard for living by three powerful rules.</div>
<div align="center">Built with React, Vite, TailwindCSS, Supabase Auth + Passkeys, and Gemini Flash AI.</div>
<br />
<div align="center">
<a href="https://next-admin-dash.vercel.app/">Demo</a>
<span> · </span>
<a href="https://vercel.com/templates/next.js/admin-dashboard-tailwind-postgres-react-nextjs">Clone & Deploy</a>
<span>
</div>

## Features

- 🔒 Supabase Auth with Passkeys (WebAuthn) and fallback credentials
- 🧠 Three foundational life rules (collapsible, with explanations)
- 🤖 Gemini Advisor Chat (AI feedback on actions, always visible)
- 🧑‍🤝‍🧑 Contacts & Notes (markdown, daily log, last 7 days, realtime sync)
- 🏛️ Hierarchy Builder (AI-sorted, manual override, tree view)
- ✍️ Daily Reflections (popup modal, tagged by rule)
- 🎨 Minimal, dark, animated UI (Framer Motion)
- 🔄 Supabase Realtime for live sync

## Environment Setup

This project requires several environment variables to function properly. Create a `.env` file in the root directory with the following:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Gemini AI API (if using the AI features)
VITE_GEMINI_API_KEY=your-gemini-api-key
```

You can get these values by:
1. Creating a Supabase project at [supabase.com](https://supabase.com)
2. Going to Project Settings > API to find your URL and anon key
3. For Gemini API, visit [ai.google.dev](https://ai.google.dev) to get an API key

## Getting Started

1. Create a Supabase project and get your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
2. Copy `.env.example` to `.env` and fill in your Supabase credentials.
3. Install dependencies:

   ```
   pnpm install
   ```

4. Run the app:

   ```
   pnpm dev
   ```

5. Login with Passkey or fallback credentials:
   - Username: **Ritesh**
   - Password: **riteshisawesome**

6. Explore the tabs: My Rules, Contacts & Notes, Hierarchy Builder.

7. Use the Gemini Advisor chat for AI-powered ethical feedback.

---
