/**
 * @nexova/auth — Paquete compartido de autenticación
 *
 * Punto de entrada único para consumir desde website y backoffice.
 *
 * Ambos frontends pueden importar así:
 *   import { useAuth, ApiError, login, getToken } from "../../../packages/shared/src/nexova_shared/auth";
 *
 * O bien desde el alias configurado en tsconfig:
 *   import { useAuth, ApiError, login } from "@nexova/auth";
 */

// API
export { ApiError, getToken, setToken, removeToken, isTokenValid, login, getAuthHeaders } from "./api";

// Hooks
export { useAuth } from "./hooks/useAuth";
export { useAuthGate } from "./hooks/useAuthGate";
export { useProtectedRoute } from "./hooks/useProtectedRoute";

// Components
export { AuthGate } from "./components/AuthGate";
export { ProtectedLayout } from "./components/ProtectedLayout";
export { LoginForm } from "./components/LoginForm";
export { SectionShell } from "./components/SectionShell";
export type { AuthGateProps } from "./components/AuthGate";
export type { ProtectedLayoutProps } from "./components/ProtectedLayout";
export type { LoginFormProps, LoginFormLabels } from "./components/LoginForm";
export type { SectionShellProps } from "./components/SectionShell";
export type { UseAuthReturn } from "./hooks/useAuth";