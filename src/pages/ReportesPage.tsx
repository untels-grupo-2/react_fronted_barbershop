import { useMemo, useState } from 'react';
import { Autocomplete, Box, Button, Card, CardContent, CircularProgress, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Assessment, AttachMoney, ConfirmationNumber, EventNote } from '@mui/icons-material';
import { useReporte } from '../hooks/useReporte';
import { calcularRango, type PresetPeriodo } from '../lib/rangoFechas';
import GraficoIngresosPorDia from '../components/reportes/GraficoIngresosPorDia';
import GraficoDistribucionServicios from '../components/reportes/GraficoDistribucionServicios';
import type { FiltroReporte } from '../types';

const formatoSoles = (monto: number): string => `S/. ${monto.toFixed(2)}`;

// Límites de los selectores de fecha: evitan años inválidos (p. ej. 111111) que
// el backend no puede parsear como LocalDate. El máximo es hoy (no tiene sentido
// reportar el futuro) y el mínimo una fecha base razonable del negocio.
const HOY = new Date().toISOString().split('T')[0];
const FECHA_MINIMA = '2020-01-01';

export default function ReportesPage() {
  const { servicios, vista, cargando, generar } = useReporte();
  const [filtro, setFiltro] = useState<FiltroReporte>({ fechaInicio: '', fechaFin: '', servicio: '' });
  const [preset, setPreset] = useState<PresetPeriodo>('personalizado');

  // Normaliza el filtro (servicio vacío => undefined) para el backend.
  const filtroNormalizado = useMemo<FiltroReporte>(() => ({ fechaInicio: filtro.fechaInicio, fechaFin: filtro.fechaFin, servicio: filtro.servicio || undefined }), [filtro]);

  // Aplica un preset rellenando las fechas; 'personalizado' las deja editar a mano.
  const aplicarPreset = (nuevo: PresetPeriodo | null) => {
    if (!nuevo) return;
    setPreset(nuevo);
    if (nuevo !== 'personalizado') {
      setFiltro((prev) => ({ ...prev, ...calcularRango(nuevo) }));
    }
  };

  // Editar una fecha a mano vuelve el período a 'personalizado'.
  const setFecha = (campo: 'fechaInicio' | 'fechaFin', valor: string) => {
    setPreset('personalizado');
    setFiltro((prev) => ({ ...prev, [campo]: valor }));
  };

  const tarjetas = vista
    ? [
        { label: 'Total reservas', value: vista.kpis.totalReservas, icon: <ConfirmationNumber />, color: '#1976d2' },
        { label: 'Ingreso total', value: formatoSoles(vista.kpis.ingresoTotal), icon: <AttachMoney />, color: '#2e7d32' },
        { label: 'Ticket promedio', value: formatoSoles(vista.kpis.ticketPromedio), icon: <Assessment />, color: '#ed6c02' },
      ]
    : [];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: '1.45rem', sm: '1.5rem' } }}>
          Reportes de ganancias
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Selecciona un rango de fechas y, opcionalmente, un servicio para analizar los ingresos.
        </Typography>
      </Box>

      {/* Filtros */}
      <Paper sx={{ borderRadius: 2, p: { xs: 2, sm: 2.5 }, mb: 3 }}>
        {/* Campos principales */}
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Fecha inicio" type="date" value={filtro.fechaInicio} onChange={(e) => setFecha('fechaInicio', e.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: FECHA_MINIMA, max: HOY } }} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Fecha fin" type="date" value={filtro.fechaFin} onChange={(e) => setFecha('fechaFin', e.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: filtro.fechaInicio || FECHA_MINIMA, max: HOY } }} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Autocomplete options={servicios} value={filtro.servicio || null} onChange={(_, value) => setFiltro({ ...filtro, servicio: value ?? '' })} renderInput={(params) => <TextField {...params} label="Servicio (opcional)" />} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button variant="contained" disableElevation startIcon={<EventNote />} onClick={() => void generar(filtroNormalizado)} disabled={cargando} fullWidth sx={{ height: 56 }}>
              {cargando ? <CircularProgress size={22} color="inherit" /> : 'Generar reporte'}
            </Button>
          </Grid>
        </Grid>

        {/* Atajos de período: en línea bajo los campos, como ayuda secundaria. */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Atajos:
          </Typography>
          <ToggleButtonGroup value={preset} exclusive onChange={(_, valor) => aplicarPreset(valor)} size="small" sx={{ flexWrap: 'wrap', gap: 0.75, '& .MuiToggleButton-root': { border: '1px solid', borderColor: 'divider', borderRadius: '999px !important', px: 2, py: 0.4, textTransform: 'none' } }}>
            <ToggleButton value="dia">Hoy</ToggleButton>
            <ToggleButton value="semana">Esta semana</ToggleButton>
            <ToggleButton value="mes">Este mes</ToggleButton>
            <ToggleButton value="mesPasado">Mes pasado</ToggleButton>
            <ToggleButton value="anio">Este año</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Estado vacío inicial */}
      {!vista && !cargando && (
        <Paper sx={{ borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Genera un reporte para visualizar los resultados.
          </Typography>
        </Paper>
      )}

      {/* Período sin reservas realizadas: mensaje explícito (criterio de aceptación) */}
      {vista && vista.kpis.totalReservas === 0 && (
        <Paper sx={{ borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            No hay datos para el período seleccionado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No se registraron reservas realizadas en el rango elegido. Prueba con otro período o servicio.
          </Typography>
        </Paper>
      )}

      {/* Resultados */}
      {vista && vista.kpis.totalReservas > 0 && (
        <>
          {/* KPI cards compactas (mismo lenguaje visual que el Dashboard).
              Altura reducida para que los gráficos suban y se vean sin scroll. */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 2 }}>
            {tarjetas.map((t) => (
              <Grid size={{ xs: 12, sm: 4 }} key={t.label}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ color: t.color, fontSize: 32, display: 'flex', alignItems: 'center' }}>{t.icon}</Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                        {t.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.label}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Gráficos */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ borderRadius: 2, p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Tendencia de ingresos por día
                </Typography>
                <GraficoIngresosPorDia datos={vista.ingresosPorDia} />
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ borderRadius: 2, p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Distribución por servicio
                </Typography>
                <GraficoDistribucionServicios datos={vista.distribucionPorServicio} />
              </Paper>
            </Grid>
          </Grid>

          {/* Tablas de desglose: por servicio y por barbero */}
          <Grid container spacing={3}>
            {/* Detalle por servicio */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, p: 2, pb: 1 }}>
                  Detalle por servicio
                </Typography>
                <TableContainer sx={{ maxHeight: 360 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: 'rgba(15, 23, 42, 0.04)' }}>Servicio</TableCell>
                        <TableCell align="right" sx={{ bgcolor: 'rgba(15, 23, 42, 0.04)' }}>
                          Ingreso
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vista.detalle.map((fila) => (
                        <TableRow key={fila.servicioNombre}>
                          <TableCell>{fila.servicioNombre}</TableCell>
                          <TableCell align="right">{formatoSoles(fila.monto)}</TableCell>
                        </TableRow>
                      ))}
                      {vista.detalle.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} align="center">
                            No hay datos para el periodo seleccionado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Desglose por barbero */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, p: 2, pb: 1 }}>
                  Desglose por barbero
                </Typography>
                <TableContainer sx={{ maxHeight: 360 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: 'rgba(15, 23, 42, 0.04)' }}>Barbero</TableCell>
                        <TableCell align="right" sx={{ bgcolor: 'rgba(15, 23, 42, 0.04)' }}>
                          Reservas
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: 'rgba(15, 23, 42, 0.04)' }}>
                          Ingreso
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vista.porBarbero.map((fila) => (
                        <TableRow key={fila.barberoNombre}>
                          <TableCell>{fila.barberoNombre}</TableCell>
                          <TableCell align="right">{fila.cantidad}</TableCell>
                          <TableCell align="right">{formatoSoles(fila.monto)}</TableCell>
                        </TableRow>
                      ))}
                      {vista.porBarbero.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No hay datos para el periodo seleccionado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
