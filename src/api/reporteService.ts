/**
 * Service Layer del módulo de reportes (PB-37).
 *
 * Aísla a la página de los detalles de transporte (axios, rutas, formatos) y de
 * la generación del PDF. La UI solo conoce este contrato; si el backend cambia
 * una ruta, se ajusta aquí sin tocar la vista.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

const formatoSoles = (monto: number): string => `S/. ${monto.toFixed(2)}`;

/**
 * Genera y descarga un PDF de ganancias en el cliente a partir de la vista ya
 * cargada (KPIs + desgloses por servicio y por barbero). Se hace en frontend
 * porque el backend no expone un endpoint de PDF de ganancias.
 */
export const descargarReportePdf = (vista: ReporteVista, filtro: FiltroReporte): void => {
  const doc = new jsPDF();

  // Encabezado
  doc.setFontSize(16);
  doc.text('Reporte de ganancias', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Periodo: ${filtro.fechaInicio} a ${filtro.fechaFin}`, 14, 25);
  if (filtro.servicio) doc.text(`Servicio: ${filtro.servicio}`, 14, 31);

  // KPIs
  const yKpis = filtro.servicio ? 40 : 36;
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text(`Total de reservas: ${vista.kpis.totalReservas}`, 14, yKpis);
  doc.text(`Ingreso total: ${formatoSoles(vista.kpis.ingresoTotal)}`, 14, yKpis + 6);
  doc.text(`Ticket promedio: ${formatoSoles(vista.kpis.ticketPromedio)}`, 14, yKpis + 12);

  // Desglose por servicio
  autoTable(doc, {
    startY: yKpis + 20,
    head: [['Servicio', 'Ingreso']],
    body: vista.detalle.map((fila) => [fila.servicioNombre, formatoSoles(fila.monto)]),
    headStyles: { fillColor: [25, 118, 210] },
  });

  // Desglose por barbero (a continuación del anterior)
  if (vista.porBarbero.length > 0) {
    const ultimaY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yKpis + 20;
    autoTable(doc, {
      startY: ultimaY + 8,
      head: [['Barbero', 'Reservas', 'Ingreso']],
      body: vista.porBarbero.map((fila) => [fila.barberoNombre, String(fila.cantidad), formatoSoles(fila.monto)]),
      headStyles: { fillColor: [46, 125, 50] },
    });
  }

  doc.save(`reporte-ganancias-${filtro.fechaInicio}-${filtro.fechaFin}.pdf`);
};

/** Lista los servicios para el autocomplete del filtro (reutiliza el endpoint existente). */
export const listarNombresServicios = async (): Promise<string[]> => {
  const { data } = await axiosClient.get('/api/servicios');
  const servicios = desempaquetar<Array<{ nombre: string }>>(data) ?? [];
  return Array.from(new Set(servicios.map((s) => s.nombre).filter(Boolean))).sort((a, b) => a.localeCompare(b));
};
