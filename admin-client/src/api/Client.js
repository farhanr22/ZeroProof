// src/api/Client.js — Central API client with JWT injection

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const TOKEN_KEY = 'snackoverflow_admin_token';

/**
 * Core fetch wrapper for the backend API.
 * - Injects Authorization header from localStorage
 * - Unwraps { data, error, error_message } response shape
 * - Throws on error: true with the server's message
 * - On 401, clears token and redirects to /login
 */
export async function apiClient(method, path, body = null) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle non-JSON responses (e.g. network errors)
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error('Server returned a non-JSON response.');
  }

  // Handle 401 — force logout
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('snackoverflow_admin_email');
    
    // Only redirect if this wasn't a login attempt itself
    if (path !== '/auth/login') {
      window.location.href = '/login';
    }
    throw new Error(json.error_message || 'Invalid credentials or expired session.');
  }

  // Handle API-level errors
  if (json.error) {
    throw new Error(json.error_message || 'An unknown error occurred.');
  }

  return json.data;
}

// ── Auth ──────────────────────────────────────────
export const authAPI = {
  login: (email, password) => apiClient('POST', '/auth/login', { email, password }),
  signup: (email, password) => apiClient('POST', '/auth/signup', { email, password }),
  changePassword: (oldPassword, newPassword) =>
    apiClient('POST', '/auth/change-password', { oldPassword, newPassword }),
};

// ── Campaigns ─────────────────────────────────────
export const campaignsAPI = {
  list: () => apiClient('GET', '/campaigns'),
  get: (id) => apiClient('GET', `/campaigns/${id}`),
  create: (name) => apiClient('POST', '/campaigns', { name }),
  updateInfo: (id, data) => apiClient('PATCH', `/campaigns/${id}/info`, data),
  activate: (id) => apiClient('POST', `/campaigns/${id}/activate`),
  delete: (id) => apiClient('DELETE', `/campaigns/${id}`),
};

// ── Contacts ──────────────────────────────────────
export const contactsAPI = {
  list: (campaignId) => apiClient('GET', `/campaigns/${campaignId}/contacts`),
  add: (campaignId, values) => apiClient('POST', `/campaigns/${campaignId}/contacts`, { values }),
  delete: (campaignId, contactId) =>
    apiClient('DELETE', `/campaigns/${campaignId}/contacts/${contactId}`),
};

// ── Questions ─────────────────────────────────────
export const questionsAPI = {
  list: (campaignId) => apiClient('GET', `/campaigns/${campaignId}/questions`),
  update: (campaignId, questions) =>
    apiClient('PATCH', `/campaigns/${campaignId}/questions`, { questions }),
};

// ── Responses & Insights ──────────────────────────
export const responsesAPI = {
  list: (campaignId) => apiClient('GET', `/campaigns/${campaignId}/responses`),
};

export const insightsAPI = {
  get: (campaignId) => apiClient('GET', `/campaigns/${campaignId}/insights`),
};
