---
status: awaiting_human_verify
trigger: "Página em amanda-planner-wkag.vercel.app mostra 'This page couldn't load' (erro de browser, não erro Next.js). Deploy marcado como Ready na Vercel."
created: 2026-05-02T00:00:00Z
updated: 2026-05-02T00:00:00Z
---

## Current Focus

hypothesis: Top-level `export const supabase = createClient()` in lib/supabase/client.ts executes at module load time during SSR (server-side rendering on Vercel). When NEXT_PUBLIC_SUPABASE_ANON_KEY is absent, createBrowserClient() throws or produces a broken client. Because lib/supabase/client.ts is imported by AppShell.tsx and InitDb.tsx (both "use client" but the import graph runs through the module evaluator during SSR bundle construction), the module-level singleton crashes the entire page render. The browser never receives a valid HTML response, so it shows "This page couldn't load" — a network-level failure, not a Next.js error page.
test: Read all relevant files to confirm import chain and confirm no defensive guard exists
expecting: Confirmed — fix is to remove the top-level singleton, replace with a lazy factory, and make the key presence non-fatal
next_action: Apply fix — convert top-level singleton to lazy factory in client.ts, then git push

## Symptoms

expected: App Next.js carrega normalmente, redireciona para /login ou /dashboard
actual: Browser mostra "This page couldn't load" — erro de browser, não página 500 do Next.js
errors: Nenhuma mensagem de erro visível além de "This page couldn't load / Reload to try again, or go back."
reproduction: Acessar amanda-planner-wkag.vercel.app em qualquer browser
started: Deploy feito 13h atrás, nunca funcionou na Vercel. Localmente funciona com `npm run dev` (disable: NODE_ENV === "development" pula o PWA service worker)

## Eliminated

- hypothesis: InitDb (Dexie/IndexedDB) causes crash server-side
  evidence: InitDb has "use client" directive AND is wrapped inside AppShell which is inside ClientOnly — it never runs server-side. Not the root cause.
  timestamp: 2026-05-02T00:00:00Z

- hypothesis: next-pwa service worker breaks first load
  evidence: next.config.ts has `disable: process.env.NODE_ENV === "development"` — the SW IS active in production. However no sw.js is committed to public/, so it gets generated at build time. The SW can cause caching issues but would show a stale page or offline page, not "This page couldn't load" on first visit. Contributing factor but not root cause.
  timestamp: 2026-05-02T00:00:00Z

- hypothesis: The re-deploy with ANON_KEY already fixed it
  evidence: git log shows commit 8f93cfc "chore: redeploy with SUPABASE_ANON_KEY env var" was pushed — but symptoms say deploy is "Blocked" on Vercel. The current live deploy (gi35hyvuq) was built without the key.
  timestamp: 2026-05-02T00:00:00Z

## Evidence

- timestamp: 2026-05-02T00:00:00Z
  checked: lib/supabase/client.ts
  found: Line 10 — `export const supabase = createClient()` — this is a MODULE-LEVEL expression, not inside a function or useEffect. It executes the moment any file imports from this module, including during SSR bundle evaluation.
  implication: If NEXT_PUBLIC_SUPABASE_ANON_KEY is undefined at build/runtime, createBrowserClient(url, undefined) is called immediately. The @supabase/ssr library's createBrowserClient validates its arguments and can throw, or returns a client in a broken state that causes an unhandled exception when first used — either way the module fails to load.

- timestamp: 2026-05-02T00:00:00Z
  checked: components/layout/AppShell.tsx
  found: Line 10 — `import { supabase } from "@/lib/supabase/client"` — AppShell imports the singleton directly at the top of the file.
  implication: When Next.js SSR evaluates the module graph for the root layout, it loads AppShell, which loads client.ts, which executes createClient() with a missing key. Crash happens before any HTML is written to the response.

- timestamp: 2026-05-02T00:00:00Z
  checked: components/InitDb.tsx
  found: Line 4 — `import { supabase } from "@/lib/supabase/client"` — same singleton import.
  implication: Secondary import path confirming the singleton is used in multiple "use client" components, both of which are in the import chain of the root layout.

- timestamp: 2026-05-02T00:00:00Z
  checked: app/layout.tsx
  found: Uses ClientOnly wrapper around AppShell, but ClientOnly only suppresses rendering on the server — the JavaScript module is still evaluated/bundled. Import side-effects (like module-level createClient()) still run.
  implication: ClientOnly does NOT prevent the module-level singleton from executing during SSR module resolution.

- timestamp: 2026-05-02T00:00:00Z
  checked: next.config.ts
  found: Uses @ducanh2912/next-pwa with `disable: process.env.NODE_ENV === "development"`. In production (Vercel), the SW is active and generated at build time.
  implication: PWA is a contributing risk for future caching issues, but not the immediate crash cause. The current build never produced a valid response to cache.

- timestamp: 2026-05-02T00:00:00Z
  checked: git log
  found: Most recent commits are "chore: redeploy" attempts. The Vercel deploy is "Blocked" meaning the re-deploy with the fixed env var hasn't run yet.
  implication: Even if we add the env var to Vercel, we need a new git push to trigger a fresh deploy AND fix the code defensively.

## Resolution

root_cause: Module-level singleton `export const supabase = createClient()` in lib/supabase/client.ts executes during SSR module evaluation. When NEXT_PUBLIC_SUPABASE_ANON_KEY is absent (as in the current live deploy), createBrowserClient() is called with undefined as the anon key, causing an exception that kills the entire page render before any HTML is sent to the browser. This explains the "This page couldn't load" browser error (no response received) rather than a Next.js error page (partial response with error).
fix: Replaced the module-level `export const supabase = createClient()` singleton in lib/supabase/client.ts with a Proxy-based lazy singleton. The real SupabaseClient is only created on first property access (inside hooks/effects, client-side), not at module evaluation time. All 11+ files importing `{ supabase }` work unchanged because the Proxy forwards all property accesses to getSupabaseClient(). Committed as 8edfeff and pushed to origin main to trigger Vercel deploy.
verification: awaiting Vercel deploy completion and manual browser test at amanda-planner-wkag.vercel.app
files_changed:
  - lib/supabase/client.ts
