import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Lazy singleton — only created on first access (client-side only).
// A module-level call to createClient() would execute during SSR module
// evaluation and crash the page if env vars are absent at build time.
let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!_client) {
    _client = createClient();
  }
  return _client;
}

// Backward-compatible named export used throughout hooks and pages.
// Implemented as a Proxy so the client is only created on first property
// access (which only happens client-side, inside hooks/event handlers).
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabaseClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
