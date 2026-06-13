# Project Rules

- Keep AI generation isolated in `src/lib/openai.ts`; AI must produce only JSON blueprints and must never receive Notion tokens or call Notion.
- Validate every blueprint with `templateBlueprintSchema` before preview, persistence-dependent use, or installation.
- Keep Notion access tokens server-only and encrypted through `src/lib/encryption.ts`.
- Use Supabase service-role access only in server modules and route handlers. Do not import `src/lib/supabase.ts` from client components.
- Add new Notion creation behavior through `src/lib/template-engine.ts` or `src/lib/notion.ts`, not from UI code.
- Handle partial installs by preserving logs in `installation_logs`.
- Do not add payments until the core questionnaire to Notion installation flow is stable.
