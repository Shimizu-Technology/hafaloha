// Centralized app configuration — single source of truth for API URLs and settings.
// All files should import from here instead of reading env vars directly.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
