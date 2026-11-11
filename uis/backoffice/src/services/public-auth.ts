import { login } from "@nexova/auth";

async function publicRequest(path: string, payload: unknown) {
  const response = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body?.detail;
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((item: { msg?: string }) => item.msg || "Dato inválido").join(" · ")
        : "No se pudo completar la solicitud.";
    throw new Error(message);
  }
  return body;
}

export async function registerAccount(input: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  address?: string;
}) {
  await publicRequest("/users", input);
  await login(input.email, input.password);
}

export async function sendPasswordReset(email: string) {
  return publicRequest("/auth/forgot-password", { email });
}

export async function saveNewPassword(token: string, newPassword: string) {
  return publicRequest("/auth/reset-password", {
    token,
    new_password: newPassword,
  });
}
