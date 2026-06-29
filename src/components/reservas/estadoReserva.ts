import type { EstadoReserva } from '../../types';

/** Color del Chip por estado (mismo criterio que el Dashboard). */
export const COLOR_ESTADO: Record<EstadoReserva, 'default' | 'warning' | 'success' | 'error'> = {
  CREADA: 'default',
  CONFIRMADA: 'warning',
  REALIZADA: 'success',
  CANCELADA: 'error',
};

/** Una transición de estado ofrecida en el detalle. */
export interface AccionEstado {
  destino: EstadoReserva;
  label: string;
  requiereMotivo: boolean;
}

/**
 * Acciones válidas según el estado actual (PB-36 §9). El backend valida la
 * transición; el frontend solo ofrece las opciones razonables.
 */
export const ACCIONES_POR_ESTADO: Record<EstadoReserva, AccionEstado[]> = {
  CREADA: [
    { destino: 'CONFIRMADA', label: 'Confirmar', requiereMotivo: false },
    { destino: 'CANCELADA', label: 'Cancelar', requiereMotivo: true },
  ],
  CONFIRMADA: [
    { destino: 'REALIZADA', label: 'Marcar como realizada', requiereMotivo: false },
    { destino: 'CANCELADA', label: 'Cancelar', requiereMotivo: true },
  ],
  REALIZADA: [],
  CANCELADA: [],
};
