/**
 * Tipos del módulo de horarios (PB-35).
 *
 * Replica el modelo de datos de la app móvil admin: el horario de la semana se
 * agrupa por día y, dentro de cada día, por turno con los barberos asignados.
 * `Raw*` es la forma que devuelve el backend; el resto son modelos de la UI.
 */

/** Días de la semana, en orden, tal como los maneja el backend (DiaSemana). */
export const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];

/** Turnos disponibles y su id de tipo de horario en el backend. */
export const TURNOS = [
  { nombre: 'MAÑANA', tipoHorarioId: 1 },
  { nombre: 'TARDE', tipoHorarioId: 2 },
  { nombre: 'NOCHE', tipoHorarioId: 3 },
] as const;
export type TurnoNombre = (typeof TURNOS)[number]['nombre'];

/** Cada entrada cruda de la semana que devuelve `GET /api/horarios-semana`. */
export interface RawHorarioInstancia {
  fecha: string;
  dia: string;
  tipoHorario: string; // "Mañana" | "Tarde" | "Noche"
  barbero: string; // nombre del barbero
}

/**
 * Cada entrada cruda de la plantilla base que devuelve `GET /api/horarios-base`
 * (preparación de la próxima semana). Incluye ids y el flag `asignado`.
 */
export interface RawHorarioBase {
  horarioBaseId: number;
  barberoId: number;
  barberoNombre: string;
  tipoHorarioId: number;
  tipoHorarioNombre: string; // "Mañana" | "Tarde" | "Noche"
  dia: string;
  asignado: boolean;
}

/**
 * Horario de la semana ya normalizado para la UI:
 * día → turno → lista de nombres de barberos asignados.
 */
export type HorarioSemana = Record<string, Record<string, string[]>>;

/** Cuerpo de `PUT /api/horarios-base`: turnos de un día por tipo de horario. */
export interface ActualizarTurnosDiaRequest {
  dia: DiaSemana;
  turnosPorTipo: Record<number, number[]>; // tipoHorarioId -> [barberoId]
}
