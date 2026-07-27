/**
 * Nebula API Client
 * Configurable client supporting local Express API mock vs external production API (http://localhost:3101/api)
 */

export interface ApiConfig {
  useMock: boolean;
  baseUrl: string;
  wsUrl?: string;
}

let currentConfig: ApiConfig = {
  useMock: true,
  baseUrl: '/api',
};

export function setApiConfig(config: Partial<ApiConfig>) {
  currentConfig = { ...currentConfig, ...config };
  if (typeof window !== 'undefined') {
    localStorage.setItem('nebula_api_config', JSON.stringify(currentConfig));
  }
}

export function getApiConfig(): ApiConfig {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('nebula_api_config');
    if (saved) {
      try {
        currentConfig = JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
  }
  return currentConfig;
}

export async function checkBackendHealth(targetBaseUrl?: string): Promise<{ ok: boolean; message: string; db?: boolean }> {
  const config = getApiConfig();
  const base = targetBaseUrl || config.baseUrl;
  
  // Try /health at the root or relative to baseUrl
  const urlsToTry = [
    `${base.replace(/\/api\/?$/, '')}/health`,
    `${base.replace(/\/$/, '')}/health`,
  ];

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json().catch(() => ({ status: 'ok' }));
        return { ok: true, message: json.status || 'ok', db: json.db };
      }
    } catch (err: any) {
      // try next
    }
  }

  return { ok: false, message: 'Backend health check failed' };
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getApiConfig();
  const url = `${config.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errJson.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return (await response.json()) as T;
  } catch (err: any) {
    console.warn(`[Nebula API Client] Call to ${url} failed:`, err);
    throw err;
  }
}
