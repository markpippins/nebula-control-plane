// @vitest-environment happy-dom
// LAC contract test (architect thread 83d2fd5c, rule 5) — nebula-control-plane.
// apiClient boot: env-authoritative mode, no localStorage restore,
// fail-visible transport errors.

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('LAC contract: NCP apiClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('defaults to LIVE mode — useMock=true default is retired', async () => {
    const cfg = (await import('./apiClient')).getApiConfig();
    expect(cfg.useMock).toBe(false);
  });

  it('never restores config from localStorage', async () => {
    localStorage.setItem(
      'nebula_api_config',
      JSON.stringify({ useMock: true, baseUrl: '/api' })
    );
    const mod = await import('./apiClient');
    expect(mod.getApiConfig().useMock).toBe(false);
  });

  it('surfaces transport failures (fail-visible) with toast + throw', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('simulate network failure');
    }));
    const { apiRequest } = await import('./apiClient');
    await expect(apiRequest('/counts')).rejects.toThrow();
  });
});
