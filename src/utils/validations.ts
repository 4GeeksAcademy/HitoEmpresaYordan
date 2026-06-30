import type { Curso, Ticket } from '../types/models';

/**
 * Valida que un curso cumpla con las reglas de negocio básicas:
 * Campos completos y valores numéricos lógicos (precios e inscritos no negativos).
 */
export function validarCurso(curso: Curso): boolean {
  if (!curso.id || !curso.titulo || !curso.categoria) {
    return false;
  }
  if (curso.precio < 0 || curso.inscritos < 0) {
    return false;
  }
  return true;
}

/**
 * Valida si un ticket infringe críticamente el SLA de 24 horas acordado por Roberto Díaz
 */
export function excedeSLA(ticket: Ticket): boolean {
  const SLA_MAXIMO_HORAS = 24;
  return ticket.horasResolucion > SLA_MAXIMO_HORAS;
}