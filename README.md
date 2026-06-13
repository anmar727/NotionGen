# Notion OS Generator

MVP SaaS for generating a structured Notion workspace blueprint from a questionnaire, previewing it, connecting a customer's Notion workspace through public OAuth, and installing the system under a selected Notion page.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- Supabase Auth and Postgres
- OpenAI structured JSON generation
- Notion public OAuth and `@notionhq/client`
- Zod validation

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in Supabase, OpenAI, Notion OAuth, and encryption values.

3. Create the Supabase schema by running `supabase/schema.sql` in the Supabase SQL editor.

4. In Notion developer settings, create a public OAuth integration and set the redirect URI to:

```text
http://localhost:3000/api/notion/oauth/callback
```

5. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Core Flow

1. User signs in with Supabase Auth.
2. User completes the Business OS questionnaire.
3. `/api/generate-template` asks OpenAI for a JSON blueprint and validates it with Zod.
4. User previews the blueprint.
5. User connects Notion with OAuth.
6. `/api/notion/search-pages` lists accessible destination pages.
7. `/api/notion/create-template` validates the stored blueprint again and installs pages, databases, blocks, and sample entries in Notion.

## Security Notes

- AI never calls Notion and never sees Notion tokens.
- Notion access tokens are encrypted before storage.
- Tokens are never exposed to client components.
- Generation and installation routes enforce usage-log rate limits.
- Partial installation logs are stored for diagnosis.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm test
```
