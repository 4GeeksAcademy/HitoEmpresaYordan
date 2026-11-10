const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface AuthResponse {
  token: string;
  user?: Record<string, unknown>;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
}

export type UserRole = 'admin' | 'manager' | 'user';

export interface UserProfile {
  id: number;
  email: string;
  is_active: boolean;
  role: UserRole;
  created_at: string;
  name: string | null;
  phone: string | null;
  address: string | null;
}

export interface ProfileResponse {
  id: number;
  user_id: number;
  name: string | null;
  phone: string | null;
  address: string | null;
}

export interface UpdateProfilePayload {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface AuthMeResponse extends Omit<UserProfile, 'name' | 'phone' | 'address'> {
  profile: ProfileResponse | null;
}

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

function handleUnauthorized(): void {
  removeToken();
  if (typeof window !== 'undefined') {
    const event = new Event('auth:logout');
    window.dispatchEvent(event);
  }
}

function getAuthHeader(): Record<string, string> {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function handleProtectedResponse(response: Response): Promise<Record<string, unknown>> {
  if (response.status === 401) {
    handleUnauthorized();
    throw new UnauthorizedError('Session expired. Please login again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ username: payload.email, password: payload.password }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail || `Login failed with status ${response.status}`);
  }

  if (typeof body.access_token !== 'string' || !body.access_token) {
    throw new Error('The server did not return an access token');
  }

  return { token: body.access_token };
}

export async function register(payload: RegisterPayload): Promise<void> {
  const name = [payload.first_name, payload.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  const user = {
    email: payload.email,
    password: payload.password,
    ...(name ? { name } : {}),
    ...(payload.phone ? { phone: payload.phone } : {}),
    ...(payload.address ? { address: payload.address } : {}),
  };
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Registration failed with status ${response.status}`);
  }
}

export async function getCurrentUser(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: getAuthHeader(),
  });

  const body = (await handleProtectedResponse(response)) as unknown as AuthMeResponse;
  return {
    id: body.id,
    email: body.email,
    is_active: body.is_active,
    role: body.role,
    created_at: body.created_at,
    name: body.profile?.name ?? null,
    phone: body.profile?.phone ?? null,
    address: body.profile?.address ?? null,
  };
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<ProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/profiles/me`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(payload),
  });

  return (await handleProtectedResponse(response)) as unknown as ProfileResponse;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('auth_token');
}

export function isTokenValid(): boolean {
  const token = getToken();
  return !!token;
}


