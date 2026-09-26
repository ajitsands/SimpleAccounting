/**
 * Simple Accounting - Anti-Caching API Helper
 * Guarantees zero caching from NGINX reverse proxies, Cloudflare, FastCGI, and Browsers.
 */

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('sa_auth_token') || '';
  
  // Append cache buster timestamp to URL
  const separator = endpoint.includes('?') ? '&' : '?';
  const urlWithCacheBuster = `${endpoint}${separator}_t=${Date.now()}`;

  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // If body is FormData (e.g. file upload), do NOT set Content-Type header so browser sets boundary
  if (!(options.body instanceof FormData) && !headers['Content-Type'] && options.method && options.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(urlWithCacheBuster, {
    cache: 'no-store',
    ...options,
    headers
  });

  return response;
}
