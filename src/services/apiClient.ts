/**
 * Nebula API Client
 * Configurable client supporting local Express API mock vs external production API (http://localhost:3101/api)
 */

export interface ApiConfig {
  useMock: boolean;
  baseUrl: string;
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
