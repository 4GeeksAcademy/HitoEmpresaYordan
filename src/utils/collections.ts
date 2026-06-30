import type { Curso, Candidato } from '../types/models';

/**
 * Filtra cursos por una categoría específica. Maneja arrays vacíos.
 */
export function filtrarCursosPorCategoria(cursos: Curso[], categoria: Curso['categoria']): Curso[] {
  if (!cursos || cursos.length === 0) return [];
  return cursos.filter(curso => curso.categoria === categoria);
}

/**
 * Ordena candidatos por múltiples criterios: Primero por ScoringCV y, si son iguales, por Nombre.
 */
export function ordenarCandidatosPorMúltiplesCampos(candidatos: Candidato[], orden: 'asc' | 'desc' = 'desc'): Candidato[] {
  if (!candidatos || candidatos.length === 0) return [];
  
  return [...candidatos].sort((a, b) => {
    // Primer criterio: ScoringCV
    if (a.scoringCV !== b.scoringCV) {
      return orden === 'asc' ? a.scoringCV - b.scoringCV : b.scoringCV - a.scoringCV;
    }
    // Segundo criterio (en caso de empate): Alfabético por nombre
    return a.nombre.localeCompare(b.nombre);
  });
}