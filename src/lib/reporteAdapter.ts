/**
 * Adapter / Mapper (PB-37).
 *
 * Traduce las respuestas crudas del backend al modelo que esperan los
 * componentes de gráfico y tabla. Son funciones puras (sin React ni red) para
 * que sean reutilizables y fáciles de probar; toda la lógica de transformación
 * vive aquí y no dispersa en la página.
 */
import type { FilaBarbero, PorcionServicio, PuntoIngresoDia, RawReporte, RawReporteSeries, ReporteKpis, ReporteVista } from '../types';

/** Redondea a 2 decimales evitando los típicos errores de coma flotante. */
const redondear = (valor: number): number => Math.round((valor + Number.EPSILON) * 100) / 100;

/** Formatea una fecha ISO (yyyy-MM-dd) a una etiqueta corta dd/MM para el eje. */
const etiquetaFecha = (iso: string): string => {
  const [, mes, dia] = iso.split('-');
  return mes && dia ? `${dia}/${mes}` : iso;
};

/** Calcula los KPIs a partir del ingreso y la cantidad de reservas. */
const calcularKpis = (ingresoTotal: number, totalReservas: number): ReporteKpis => ({
  totalReservas,
  ingresoTotal: redondear(ingresoTotal),
  ticketPromedio: totalReservas > 0 ? redondear(ingresoTotal / totalReservas) : 0,
});

/** Mapea la distribución por servicio ordenada de mayor a menor ingreso. */
const mapearDistribucion = (porServicio: RawReporteSeries['desglosePorServicio']): PorcionServicio[] =>
  porServicio.map((s) => ({ servicioNombre: s.servicioNombre, monto: redondear(s.ingresoTotal) })).sort((a, b) => b.monto - a.monto);

/** Mapea la serie de ingresos por día respetando el orden cronológico. */
const mapearIngresosPorDia = (porDia: RawReporteSeries['desglosePorDia']): PuntoIngresoDia[] =>
  [...porDia].sort((a, b) => a.fecha.localeCompare(b.fecha)).map((d) => ({ fecha: etiquetaFecha(d.fecha), monto: redondear(d.ingresoTotal) }));

/** Mapea el desglose por barbero ordenado de mayor a menor ingreso. */
const mapearPorBarbero = (porBarbero: RawReporteSeries['desglosePorBarbero']): FilaBarbero[] =>
  porBarbero.map((b) => ({ barberoNombre: b.barberoNombre, monto: redondear(b.ingresoTotal), cantidad: b.totalReservas })).sort((a, b) => b.monto - a.monto);

/**
 * Caso principal: el backend entrega el reporte detallado (total + por día +
 * por servicio + por barbero). Produce la vista con todos los gráficos y
 * desgloses poblados. El backend ya envía `ticketPromedio` calculado.
 */
export const adaptarDesdeSeries = (series: RawReporteSeries): ReporteVista => {
  const distribucion = mapearDistribucion(series.desglosePorServicio);

  return {
    kpis: {
      totalReservas: series.totalReservas,
      ingresoTotal: redondear(series.ingresoTotal),
      ticketPromedio: redondear(series.ticketPromedio),
    },
    ingresosPorDia: mapearIngresosPorDia(series.desglosePorDia),
    distribucionPorServicio: distribucion,
    detalle: distribucion,
    porBarbero: mapearPorBarbero(series.desglosePorBarbero),
  };
};

/**
 * Fallback: el endpoint de series aún no existe y solo contamos con el agregado
 * actual `GET /api/reservas/reportes`. Genera una vista válida con KPIs y tabla;
 * el gráfico por día queda vacío (no hay datos diarios) y la distribución
 * contiene la única fila agregada disponible.
 */
export const adaptarDesdeAgregado = (agregado: RawReporte): ReporteVista => {
  const distribucion: PorcionServicio[] = agregado.cantidadReservas > 0 ? [{ servicioNombre: agregado.servicioNombre || 'Todos los servicios', monto: redondear(agregado.montoTotal) }] : [];

  return {
    kpis: calcularKpis(agregado.montoTotal, agregado.cantidadReservas),
    ingresosPorDia: [],
    distribucionPorServicio: distribucion,
    detalle: distribucion,
    porBarbero: [],
  };
};
