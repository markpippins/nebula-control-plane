// LAC — Live-Authoritative Contract helper (architect thread 83d2fd5c).
//
// Rules implemented here (copy this file verbatim across UI apps, renaming
// only the VITE_ key):
//   1. Env is the sole mode authority — resolved exactly once at bootstrap.
//      localStorage/sessionStorage are NEVER consulted for mode.
//   2. Mock is explicit opt-in: mode = 'mock' only when VITE_<KEY> === 'mock'.
//      Production default is 'live' (no implicit mock anywhere).
//   3. Fail-visible: in live mode callers MUST surface transport errors;
//      falling back to fixtures after a live failure is a defect class
//      (contract-test enforced, see lac.contract.test.ts).

export type LacMode = 'live' | 'mock';

/**
 * Resolve the LAC mode from an import.meta-style env bag.
 * Defaults to 'live'; only the exact string 'mock' opts out.
 */
export function resolveLacMode(env: Record<string, unknown> | undefined, key: string): LacMode {
  return env?.[key] === 'mock' ? 'mock' : 'live';
}

/** True when a resolved env value names a backend target (documented default allowed). */
export function resolveTargetUrl(env: Record<string, unknown> | undefined, key: string, documentedDefault: string): string {
  const v = env?.[key];
  return typeof v === 'string' && v.length > 0 ? v : documentedDefault;
}
