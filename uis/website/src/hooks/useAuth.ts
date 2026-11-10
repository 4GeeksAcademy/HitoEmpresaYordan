// Re-export del hook compartido.
// El resto del website puede seguir importando desde @/hooks/useAuth
// sin cambiar sus imports.
export { useAuth } from "@nexova/auth";
export type { UseAuthReturn } from "@nexova/auth";
