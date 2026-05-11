const localApiUrl = 'http://localhost:4000';

export function getApiBaseUrl() {
  const configuredUrl = String(import.meta.env.VITE_API_URL || '').trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  if (import.meta.env.DEV) {
    return localApiUrl;
  }

  throw new Error(
    'Production API URL is not configured. Add VITE_API_URL in Vercel and redeploy.',
  );
}

export async function apiFetch(path: string, init?: RequestInit) {
  const apiUrl = getApiBaseUrl();
  const url = path.startsWith('http') ? path : `${apiUrl}${path}`;

  try {
    return await fetch(url, init);
  } catch (error) {
    throw new Error(
      `Could not reach the API server at ${apiUrl}. Check VITE_API_URL, backend deployment, HTTPS, and CORS.`,
    );
  }
}
