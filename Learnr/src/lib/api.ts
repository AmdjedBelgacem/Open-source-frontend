import axios from 'axios';

const api = axios.create({
  baseURL: '',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 60_000,
});

function assertSafeApiPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new Error('API path must be a relative path starting with "/".');
  }

  // Prevent accidental SSRF/open-redirect patterns by rejecting full URLs.
  if (/^https?:\/\//i.test(path)) {
    throw new Error('Absolute URLs are not allowed in API client calls.');
  }

  return path;
}

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function get(path, config) {
  const res = await api.get(assertSafeApiPath(path), config);
  return res.data;
}

export async function post(path, body, config) {
  const res = await api.post(assertSafeApiPath(path), body, config);
  return res.data;
}

export default api;
