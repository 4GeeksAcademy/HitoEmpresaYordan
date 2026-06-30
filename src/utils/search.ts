import type { Ticket, Candidato } from '../types/models';

/**
 * Búsqueda Lineal: Encuentra un ticket por su ID en un array desordenado
 * Devuelve el índice o -1 si no se encuentra
 */
export function busquedaLinealTicket(tickets: Ticket[], idBuscado: string): number {
  for (let i = 0; i < tickets.length; i++) {
    if (tickets[i].id === idBuscado) {
      return i;
    }
  }
  return -1;
}

/**
 * Búsqueda Binaria: Encuentra un candidato por su scoringCV exacto.
 * ¡IMPORTANTE!: El array DEBE estar ordenado por 'scoringCV' de forma ascendente previamente.
 */
export function busquedaBinariaCandidatoPorScoring(candidatosOrdenados: Candidato[], scoringBuscado: number): number {
  let inicio = 0;
  let fin = candidatosOrdenados.length - 1;

  while (inicio <= fin) {
    const medio = Math.floor((inicio + fin) / 2);
    const valorMedio = candidatosOrdenados[medio].scoringCV;

    if (valorMedio === scoringBuscado) {
      return medio; // Encontrado
    } else if (valorMedio < scoringBuscado) {
      inicio = medio + 1; // Buscar en la mitad derecha
    } else {
      fin = medio - 1; // Buscar en la mitad izquierda
    }
  }

  return -1; // No encontrado
}