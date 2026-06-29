/** Estados posibles de una reserva (fuente única de verdad). */
export const ESTADOS_RESERVA = ['CREADA', 'CONFIRMADA', 'REALIZADA', 'CANCELADA'] as const;

export type EstadoReserva = (typeof ESTADOS_RESERVA)[number];

export interface ReservaHoy {
  id: number;
  cliente: string;
  barbero: string;
  servicio: string;
  hora: string;
  estado: EstadoReserva;
}

export interface ReservaBackend {
  reservaId: number;
  usuarioNombre: string;
  barberoNombre: string;
  servicioNombre: string;
  horarioRango: string;
  estado: EstadoReserva;
}

/** Reserva cruda completa que devuelve `GET /api/reservas/admin` (DtoReservaResponse). */
export interface RawReservaAdmin {
  reservaId: number;
  usuarioNombre: string;
  usuarioId: number;
  barberoNombre: string;
  servicioNombre: string;
  horarioRango: string;
  fechaReserva: string;
  fechaCreacion: string;
  estado: EstadoReserva;
  motivoDescripcion: string | null;
  adicionales: string | null;
  precioServicio: number;
  urlPago: string | null;
  estRecompensa: number | null;
  montoTotal: number | null;
}

/** Reserva normalizada para la UI de la tabla y el detalle (PB-36). */
export interface ReservaAdmin {
  id: number;
  cliente: string;
  clienteId: number;
  barbero: string;
  servicio: string;
  hora: string;
  fecha: string;
  fechaCreacion: string;
  estado: EstadoReserva;
  motivo: string | null;
  adicionales: string | null;
  precio: number;
  urlPago: string | null;
}

/** Filtros combinables de la tabla de reservas. */
export interface FiltroReservas {
  estado?: EstadoReserva;
  fechaDesde?: string;
  fechaHasta?: string;
  barberoId?: number;
  clienteId?: number;
}

/** Página de resultados que entrega Spring (`Page<T>`). */
export interface PaginaReservas {
  reservas: ReservaAdmin[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
