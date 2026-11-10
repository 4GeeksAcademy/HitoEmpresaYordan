const TOKEN_STORAGE_KEY = "access_token";
const SESSION_CHANGE_EVENT = "auth:session-change";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getAccessTokenSnapshot(): string | null {
  return getAccessToken();
}

export function getServerAccessTokenSnapshot(): null {
  return null;
}

export function subscribeToAuthSession(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener("storage", onChange);
  window.addEventListener(SESSION_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SESSION_CHANGE_EVENT, onChange);
  };
}

function notifySessionChange(): void {
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function setAccessToken(token: string): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  notifySessionChange();
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  notifySessionChange();
}

export function isAccessTokenValid(token: string | null): boolean {
  if (!token) return false;

  const expiration = getAccessTokenExpiration(token);
  return expiration !== null && expiration > Date.now();
}

export function getAccessTokenExpiration(token: string | null): number | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) return null;

  try {
    const base64Payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(base64Payload)) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function getAuthorizationHeader(): Record<string, string> {
  const token = getAccessToken();

  if (!isAccessTokenValid(token)) {
    if (token) clearAccessToken();
    throw new Error("Tu sesión ha expirado. Inicia sesión para continuar.");
  }

  return { Authorization: `Bearer ${token}` };
}

export function logout(): void {
  if (typeof window === "undefined") return;

  clearAccessToken();
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}