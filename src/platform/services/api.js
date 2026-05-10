const BASE = '/api/v1';

function getToken() {
  return localStorage.getItem('mirai_token');
}

function getRefreshToken() {
  return localStorage.getItem('mirai_refresh_token');
}

async function tryRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) return false;

  const data = await res.json();
  localStorage.setItem('mirai_token', data.access_token);
  localStorage.setItem('mirai_refresh_token', data.refresh_token);
  return true;
}

async function request(method, path, body, isRetry = false) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Access token expiré — on tente un refresh silencieux (une seule fois)
  if (res.status === 401 && !isRetry && !path.startsWith('/auth/')) {
    const refreshed = await tryRefresh();
    if (refreshed) return request(method, path, body, true);

    // Refresh échoué : session terminée
    localStorage.removeItem('mirai_token');
    localStorage.removeItem('mirai_refresh_token');
    localStorage.removeItem('mirai_answers');
    window.location.reload();
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erreur ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path)        => request('DELETE', path),
};
