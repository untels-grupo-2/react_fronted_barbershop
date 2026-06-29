/**
 * Service Layer del módulo de reservas admin (PB-36).
 *
 * Aísla a la página de los detalles de transporte (axios, rutas, paginación de
 * Spring) y normaliza la respuesta del backend al modelo que consume la UI.
 */
import axiosClient from './axiosClient';
import type { EstadoReserva, FiltroReservas, PaginaReservas, RawReservaAdmin, ReservaAdmin } from '../types';

/** Configuración del listado de reservas (un solo lugar). */
export const RESERVAS_POR_PAGINA = 20; // CA-1: máximo 20 por página
const ORDEN_LISTADO = 'fechaReserva,desc'; // CA-1: orden por fecha descendente

/** Forma de `Page<T>` que devuelve Spring dentro de `ApiResponse.data`. */
interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // página actual (0-based)
  size: number;
}

/** Adapter: convierte la reserva cruda del backend al modelo de la UI. */
const adaptarReserva = (raw: RawReservaAdmin): ReservaAdmin => ({
  id: raw.reservaId,
  cliente: raw.usuarioNombre,
  clienteId: raw.usuarioId,
  barbero: raw.barberoNombre,
  servicio: raw.servicioNombre,
  hora: raw.horarioRango,
  fecha: raw.fechaReserva,
  fechaCreacion: raw.fechaCreacion,
  estado: raw.estado,
  motivo: raw.motivoDescripcion,
  adicionales: raw.adicionales,
  precio: raw.precioServicio,
  urlPago: raw.urlPago,
});

/** Construye los query params, omitiendo los filtros vacíos. */
const construirParams = (filtro: FiltroReservas, page: number, size: number) => ({
  page,
  size,
  sort: ORDEN_LISTADO,
  ...(filtro.estado ? { estado: filtro.estado } : {}),
  ...(filtro.fechaDesde ? { fechaDesde: filtro.fechaDesde } : {}),
  ...(filtro.fechaHasta ? { fechaHasta: filtro.fechaHasta } : {}),
  ...(filtro.barberoId ? { barberoId: filtro.barberoId } : {}),
  ...(filtro.clienteId ? { clienteId: filtro.clienteId } : {}),
});

/** Lista las reservas con filtros combinables y paginación del lado del servidor. */
export const listarReservas = async (filtro: FiltroReservas, page: number, size: number): Promise<PaginaReservas> => {
  const { data } = await axiosClient.get('/api/reservas/admin', { params: construirParams(filtro, page, size) });
  const pagina = (data?.data ?? {}) as SpringPage<RawReservaAdmin>;
  return {
    reservas: (pagina.content ?? []).map(adaptarReserva),
    totalElements: pagina.totalElements ?? 0,
    totalPages: pagina.totalPages ?? 0,
    page: pagina.number ?? 0,
    size: pagina.size ?? size,
  };
};

/** Cambia el estado de una reserva (CONFIRMADA / REALIZADA / CANCELADA). */
export const cambiarEstadoReserva = async (id: number, estado: EstadoReserva, motivoDescripcion?: string): Promise<void> => {
  await axiosClient.put(`/api/reservas/${id}/estado`, null, {
    params: { estado, ...(motivoDescripcion ? { motivoDescripcion } : {}) },
  });
};
