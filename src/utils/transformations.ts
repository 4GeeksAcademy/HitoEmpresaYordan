import type { Ticket, Curso } from '../types/models';

export interface ReporteCursos {
  totalInscritos: number;
  cursoConMasInscritos: Curso | null;
  cursoConMenosInscritos: Curso | null;
}

/**
 * Calcula el promedio de horas de resolución de los tickets.
 * Cumple con el control de casos vacíos exigido.
 */
export function calcularPromedioHorasResolucion(tickets: Ticket[]): number {
  if (!tickets || tickets.length === 0) return 0;
  const totalHoras = tickets.reduce((suma, ticket) => suma + ticket.horasResolucion, 0);
  return totalHoras / tickets.length;
}

/**
 * Genera un reporte completo para Formación Corporativa buscando valores extremos (Máximos y Mínimos)
 */
export function generarReporteCursos(cursos: Curso[]): ReporteCursos {
  if (!cursos || cursos.length === 0) {
    return { totalInscritos: 0, cursoConMasInscritos: null, cursoConMenosInscritos: null };
  }

  const totalInscritos = cursos.reduce((total, curso) => total + curso.inscritos, 0);
  
  // Encontrar Máximos y Mínimos de forma pura
  const cursoConMasInscritos = cursos.reduce((max, curso) => curso.inscritos > max.inscritos ? curso : max, cursos[0]);
  const cursoConMenosInscritos = cursos.reduce((min, curso) => curso.inscritos < min.inscritos ? curso : min, cursos[0]);

  return {
    totalInscritos,
    cursoConMasInscritos,
    cursoConMenosInscritos
  };
}