/**
 * Service Layer del módulo de horarios (PB-35).
 *
 * Aísla a la página de los detalles de transporte (axios, rutas) y normaliza la
 * respuesta del backend al modelo que consume la UI. Replica las operaciones de
 * la app móvil admin sobre el backend hexagonal.
 */
import axiosClient from './axiosClient';
import type { ActualizarTurnosDiaRequest, HorarioSemana, RawHorarioBase, RawHorarioInstancia } from '../types';

/** Lee el `data` envuelto por `ApiResponse` del backend de forma tipada. */
const desempaquetar = <T>(payload: unknown): T => (payload as { data: T }).data;

/** Normaliza "Mañana"/"Tarde"/"Noche" a la clave de turno en mayúsculas (MAÑANA...). */
const normalizarTurno = (tipoHorario: string): string => tipoHorario.trim().toUpperCase();

/**
 * Adapter: convierte la respuesta agrupada por día del backend
 * (`{ dia: [{tipoHorario, barbero, ...}] }`) en `día → turno → [barberos]`,
 * que es lo que la UI necesita para pintar la grilla.
 */
const adaptarSemana = (porDia: Record<string, RawHorarioInstancia[]>): HorarioSemana => {
  const semana: HorarioSemana = {};
  for (const [dia, entradas] of Object.entries(porDia ?? {})) {
    const turnos: Record<string, string[]> = {};
    for (const entrada of entradas) {
      const turno = normalizarTurno(entrada.tipoHorario);
      (turnos[turno] ??= []).push(entrada.barbero);
    }
    semana[dia] = turnos;
  }
  return semana;
};

/**
 * Horario DEFINITIVO de la semana actual (solo lectura, regla de negocio: la
 * semana en curso no se edita). Normalizado para la UI.
 */
export const obtenerHorarioSemana = async (): Promise<HorarioSemana> => {
  const { data } = await axiosClient.get('/api/horarios-semana');
  return adaptarSemana(desempaquetar<Record<string, RawHorarioInstancia[]>>(data));
};

/**
 * Adapter de la plantilla base (`GET /api/horarios-base`): la respuesta lista
 * TODAS las combinaciones día/turno/barbero con un flag `asignado`; nos quedamos
 * solo con las asignadas y las agrupamos en `día → turno → [barberos]`.
 */
const adaptarBase = (porDia: Record<string, RawHorarioBase[]>): HorarioSemana => {
  const semana: HorarioSemana = {};
  for (const [dia, entradas] of Object.entries(porDia ?? {})) {
    const turnos: Record<string, string[]> = {};
    for (const entrada of entradas) {
      if (!entrada.asignado) continue;
      const turno = normalizarTurno(entrada.tipoHorarioNombre);
      (turnos[turno] ??= []).push(entrada.barberoNombre);
    }
    semana[dia] = turnos;
  }
  return semana;
};

/**
 * Horario en preparación para la PRÓXIMA semana (plantilla base), normalizado.
 * Es lo que el admin edita; permite ver al instante lo que prepara.
 */
export const obtenerHorarioProximaSemana = async (): Promise<HorarioSemana> => {
  const { data } = await axiosClient.get('/api/horarios-base');
  return adaptarBase(desempaquetar<Record<string, RawHorarioBase[]>>(data));
};

/** Actualiza los turnos de un día (qué barberos trabajan en cada turno). */
export const actualizarTurnosDia = async (request: ActualizarTurnosDiaRequest): Promise<void> => {
  await axiosClient.put('/api/horarios-base', request);
};

/** Confirma la plantilla para la próxima semana (dispara el scheduler del backend). */
export const confirmarHorario = async (): Promise<void> => {
  await axiosClient.put('/api/horarios-base/confirmacion');
};
