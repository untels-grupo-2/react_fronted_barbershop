import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { obtenerReporte, listarNombresServicios } from '../api/reporteService';
import { useNotification } from './useNotification';
import type { FiltroReporte, ReporteVista } from '../types';

/**
 * Valida que una cadena sea una fecha ISO real con año de 4 dígitos
 * (yyyy-MM-dd). Filtra entradas como '111111-01-01' que el backend rechaza.
 */
const esFechaValida = (valor: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  return !Number.isNaN(new Date(valor).getTime());
};

/**
 * Custom Hook que orquesta la carga de reportes (PB-37).
 *
 * Encapsula el estado (vista, servicios, carga) y delega el acceso a datos en el
 * Service Layer, dejando a `ReportesPage` solo la responsabilidad de presentar.
 */
export const useReporte = () => {
  const { showError } = useNotification();
  const [servicios, setServicios] = useState<string[]>([]);
  const [vista, setVista] = useState<ReporteVista | null>(null);
  const [cargando, setCargando] = useState(false);

  // Catálogo de servicios para el autocomplete (una sola vez).
  useEffect(() => {
    listarNombresServicios()
      .then(setServicios)
      .catch(() => setServicios([])); // El filtro por servicio es opcional: degradamos en silencio.
  }, []);

  const generar = useCallback(
    async (filtro: FiltroReporte) => {
      if (!filtro.fechaInicio || !filtro.fechaFin) {
        showError('Selecciona la fecha de inicio y la fecha de fin');
        return;
      }
      // Rechaza fechas mal formadas (p. ej. años de 6 dígitos tecleados a mano)
      // antes de llegar al backend, que no puede parsearlas como LocalDate.
      if (!esFechaValida(filtro.fechaInicio) || !esFechaValida(filtro.fechaFin)) {
        showError('Ingresa fechas válidas con el formato día/mes/año');
        return;
      }
      if (filtro.fechaInicio > filtro.fechaFin) {
        showError('La fecha de inicio no puede ser posterior a la fecha de fin');
        return;
      }

      setCargando(true);
      try {
        setVista(await obtenerReporte(filtro));
      } catch (error: unknown) {
        const backendMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
        showError(backendMessage ?? 'No se pudo generar el reporte');
      } finally {
        setCargando(false);
      }
    },
    [showError],
  );

  return { servicios, vista, cargando, generar };
};
