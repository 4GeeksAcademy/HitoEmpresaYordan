// Entidad Operaciones de Selección 
export interface Candidato {
  id: string
  nombre: string;
  puesto: string; // ej: "SDR", "Consultor"
  scoringCV: number; // Puntuación de 0 a 100
  estado: 'Criba' | 'Entrevista' | 'Contratado' | 'Descartado';
}

// Entidad para Formación Corporativa 
export interface Curso {
  id: string;
  titulo: string;
  categoria: 'Liderazgo' | 'Comunicación' | 'Habilidades Blandas';
  precio: number;
  inscritos: number;
}

// Entidad para Atención al Cliente / Soporte 
export interface Ticket {
  id: string;
  cliente: string;
  prioridad: 'Baja' | 'Media' | 'Alta';
  horasResolucion: number; // Tiempo que tomó resolverlo
  estado: 'Abierto' | 'En Proceso' | 'Resuelto';
}