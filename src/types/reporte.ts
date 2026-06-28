/**
 * Tipos del módulo de reportes de ganancias (PB-37).
 *
 * `Raw*` representa la forma exacta que devuelve el backend; el resto son los
 * modelos que consume la UI. La conversión entre ambos vive en el Adapter
 * (`lib/reporteAdapter.ts`), no en los componentes.
 */

/** Agregado que devuelve hoy `GET /api/reservas/reportes`. */
export interface RawReporte {
  servicioNombre: string;
  montoTotal: number;
  cantidadReservas: number;
}

/**
 * Reporte detallado que devuelve `GET /api/reservas/reportes/series`
 * (modelo `ReporteGanancias` del backend, sin envoltorio ApiResponse):
 * total + ticket + desgloses por día (tendencia), por servicio y por barbero.
 */
export interface RawReporteSeries {
  fechaInicio: string;
  fechaFin: string;
  totalReservas: number;
  ingresoTotal: number;
  ticketPromedio: number;
  desglosePorDia: Array<{ fecha: string; totalReservas: number; ingresoTotal: number }>;
  desglosePorServicio: Array<{ servicioId: number; servicioNombre: string; totalReservas: number; ingresoTotal: number }>;
  desglosePorBarbero: Array<{ barberoId: number; barberoNombre: string; totalReservas: number; ingresoTotal: number }>;
}

/** Filtros de consulta seleccionados por el admin. */
export interface FiltroReporte {
  fechaInicio: string; // ISO yyyy-MM-dd
  fechaFin: string; // ISO yyyy-MM-dd
  servicio?: string; // nombre del servicio (opcional)
}

/** KPIs derivados que muestran las tarjetas resumen. */
export interface ReporteKpis {
  totalReservas: number;
  ingresoTotal: number;
  ticketPromedio: number; // ingreso / reservas
}

/** Punto de la serie de ingresos por día (gráfico de barras). */
export interface PuntoIngresoDia {
  fecha: string; // etiqueta legible para el eje X
  monto: number;
}

/** Porción de la distribución por servicio (gráfico de pastel / tabla). */
export interface PorcionServicio {
  servicioNombre: string;
  monto: number;
}

/** Fila del desglose por barbero. */
export interface FilaBarbero {
  barberoNombre: string;
  monto: number;
  cantidad: number;
}

/** Modelo de presentación completo que consume `ReportesPage`. */
export interface ReporteVista {
  kpis: ReporteKpis;
  ingresosPorDia: PuntoIngresoDia[];
  distribucionPorServicio: PorcionServicio[];
  detalle: PorcionServicio[]; // filas de la tabla detallada por servicio
  porBarbero: FilaBarbero[]; // desglose por barbero
}
