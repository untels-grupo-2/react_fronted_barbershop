/**
 * Service Layer del módulo de reportes (PB-37).
 *
 * Aísla a la página de los detalles de transporte (axios, rutas, formatos).
 * La UI solo conoce este contrato; si el backend cambia una ruta o aparece el
 * endpoint de series, se ajusta aquí sin tocar la vista.
 */
import axiosClient from './axiosClient';
import { adaptarDesdeAgregado, adaptarDesdeSeries } from '../lib/reporteAdapter';
import type { FiltroReporte, RawReporte, RawReporteSeries, ReporteVista } from '../types';

/** Lee el `data` envuelto por `ApiResponse` del backend de forma tipada. */
const desempaquetar = <T>(payload: unknown): T => (payload as { data: T }).data;

/** Convierte el filtro de la UI en los query params que acepta el backend. */
const toParams = (filtro: FiltroReporte) => ({
  fechaInicio: filtro.fechaInicio,
  fechaFin: filtro.fechaFin,
  ...(filtro.servicio ? { servicio: filtro.servicio } : {}),
});

/**
 * Obtiene la vista de reportes lista para renderizar.
 *
 * Usa el endpoint detallado `GET /api/reservas/reportes/series` (total +
 * desgloses por día, servicio y barbero). Si por algún motivo no estuviera
 * disponible, degrada al agregado `GET /api/reservas/reportes` para que la
 * página siga mostrando al menos KPIs y tabla.
 */
export const obtenerReporte = async (filtro: FiltroReporte): Promise<ReporteVista> => {
  try {
    // El endpoint de series devuelve el modelo directo (sin envoltorio ApiResponse).
    const { data } = await axiosClient.get<RawReporteSeries>('/api/reservas/reportes/series', { params: toParams(filtro) });
    return adaptarDesdeSeries(data);
  } catch {
    // Fallback al agregado existente (este sí va envuelto en ApiResponse).
    const { data } = await axiosClient.get('/api/reservas/reportes', { params: toParams(filtro) });
    return adaptarDesdeAgregado(desempaquetar<RawReporte>(data));
  }
};

/** Lista los servicios para el autocomplete del filtro (reutiliza el endpoint existente). */
export const listarNombresServicios = async (): Promise<string[]> => {
  const { data } = await axiosClient.get('/api/servicios');
  const servicios = desempaquetar<Array<{ nombre: string }>>(data) ?? [];
  return Array.from(new Set(servicios.map((s) => s.nombre).filter(Boolean))).sort((a, b) => a.localeCompare(b));
};
