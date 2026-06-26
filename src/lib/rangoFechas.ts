/**
 * Cálculo de rangos de fecha para los presets de período (día / semana / mes).
 * Funciones puras y sin dependencias para que sean reutilizables y testeables.
 */

/** Identificadores de los presets soportados por la pantalla de reportes. */
export type PresetPeriodo = 'dia' | 'semana' | 'mes' | 'mesPasado' | 'anio' | 'personalizado';

/** Formatea una fecha a ISO yyyy-MM-dd usando la fecha LOCAL (no UTC). */
const toIso = (fecha: Date): string => {
  const offset = fecha.getTimezoneOffset() * 60000;
  return new Date(fecha.getTime() - offset).toISOString().split('T')[0];
};

/**
 * Devuelve el rango [inicio, fin] correspondiente a un preset, tomando `hoy`
 * como referencia (inyectable para pruebas; por defecto la fecha actual).
 *   - dia       : solo el día de hoy
 *   - semana    : desde el lunes de esta semana hasta hoy
 *   - mes       : desde el día 1 de este mes hasta hoy
 *   - mesPasado : todo el mes calendario anterior (día 1 al último)
 *   - anio      : desde el 1 de enero de este año hasta hoy
 */
export const calcularRango = (preset: Exclude<PresetPeriodo, 'personalizado'>, hoy: Date = new Date()): { fechaInicio: string; fechaFin: string } => {
  // Casos cuyo rango NO termina en "hoy": se resuelven y retornan aparte.
  if (preset === 'mesPasado') {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0); // día 0 del mes actual = último del anterior
    return { fechaInicio: toIso(inicio), fechaFin: toIso(fin) };
  }

  // Casos cuyo rango termina en "hoy".
  const inicio = new Date(hoy);
  if (preset === 'semana') {
    // getDay(): domingo=0..sábado=6. Llevamos el inicio al lunes de esta semana.
    const diaSemana = (hoy.getDay() + 6) % 7; // lunes=0..domingo=6
    inicio.setDate(hoy.getDate() - diaSemana);
  } else if (preset === 'mes') {
    inicio.setDate(1);
  } else if (preset === 'anio') {
    inicio.setMonth(0, 1); // 1 de enero
  }
  // 'dia' deja inicio === hoy

  return { fechaInicio: toIso(inicio), fechaFin: toIso(hoy) };
};
