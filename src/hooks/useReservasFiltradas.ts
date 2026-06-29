import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { listarReservas, RESERVAS_POR_PAGINA } from '../api/reservaService';
import { useNotification } from './useNotification';
import type { EstadoReserva, FiltroReservas, ReservaAdmin } from '../types';

/**
 * Custom Hook del módulo de reservas (PB-36).
 *
 * Encapsula la lógica de filtros + paginación del lado del servidor y delega el
 * acceso a datos en el Service Layer, dejando a la página solo presentar.
 * Recarga automáticamente cuando cambian los filtros o la página.
 */
export const useReservasFiltradas = () => {
  const { showError } = useNotification();
  const [filtro, setFiltro] = useState<FiltroReservas>({});
  const [page, setPage] = useState(0);
  const [reservas, setReservas] = useState<ReservaAdmin[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const pagina = await listarReservas(filtro, page, RESERVAS_POR_PAGINA);
      setReservas(pagina.reservas);
      setTotalElements(pagina.totalElements);
    } catch (error: unknown) {
      const backendMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
      showError(backendMessage ?? 'No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
    }
  }, [filtro, page, showError]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Aplica filtros nuevos y vuelve a la primera página (CA-2 / CA-3). */
  const aplicarFiltro = useCallback((nuevo: FiltroReservas) => {
    setFiltro(nuevo);
    setPage(0);
  }, []);

  /**
   * Actualiza el estado de una reserva en su sitio, sin recargar la lista.
   * Evita el salto de scroll: la fila se queda donde está y refleja el cambio.
   */
  const actualizarEstadoLocal = useCallback((id: number, estado: EstadoReserva, motivo?: string) => {
    setReservas((prev) => prev.map((r) => (r.id === id ? { ...r, estado, motivo: motivo ?? r.motivo } : r)));
  }, []);

  return { reservas, totalElements, loading, page, size: RESERVAS_POR_PAGINA, filtro, setPage, aplicarFiltro, actualizarEstadoLocal, recargar: cargar };
};
