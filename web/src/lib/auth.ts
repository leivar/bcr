export const TOKEN_KEY = "bc_jwt";

// Save JWT in localStorage (client-side only).
export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

// Read JWT from localStorage (client-side only).
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Remove JWT from localStorage.
export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// Convenience: true if a token exists.
export function isAuthenticated(): boolean {
  return !!getToken();
}
