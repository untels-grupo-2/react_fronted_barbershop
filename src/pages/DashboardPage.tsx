import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Chip, Table, TableBody, TableCell, TableHead, TableRow, Paper, Box, Stack } from '@mui/material';
import { CalendarMonth, AttachMoney, ContentCut, StarRate } from '@mui/icons-material';
import axiosClient from '../api/axiosClient';
import type { ReservaBackend, ReservaHoy, EstadoReserva } from '../types';

const estadoColor: Record<EstadoReserva, 'default' | 'warning' | 'success' | 'error'> = { CREADA: 'default', CONFIRMADA: 'warning', REALIZADA: 'success', CANCELADA: 'error' };

export default function DashboardPage() {
  const [reservasHoy, setReservasHoy] = useState<ReservaHoy[]>([]);
  const [metricas, setMetricas] = useState({ reservasHoy: 0, ingresosMes: 0, barberos: 0, promedioValoracion: 0 });

  useEffect(() => {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const now = new Date();
    const hoy = formatDate(now);
    const inicioMes = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    // Llamadas paralelas al backend
    Promise.all([axiosClient.get('/api/reservas/admin', { params: { fechaDesde: hoy, fechaHasta: hoy, size: 100 } }), axiosClient.get('/api/barberos'), axiosClient.get('/api/valoraciones'), axiosClient.get('/api/reservas/reportes', { params: { fechaInicio: inicioMes, fechaFin: hoy } })]).then(([reservasRes, barberosRes, valoracionRes, reportesRes]) => {
      // /reservas/admin devuelve un Page<>: las reservas están en data.data.content
      const contenido = (reservasRes.data.data?.content ?? []) as ReservaBackend[];
      const reservas = contenido.map((item) => ({ id: item.reservaId, cliente: item.usuarioNombre, barbero: item.barberoNombre, servicio: item.servicioNombre, hora: item.horarioRango, estado: item.estado }));
      const valoraciones = (valoracionRes.data.data ?? []) as Array<{ valoracion: number }>;
      const promedioValoracion = valoraciones.length > 0 ? valoraciones.reduce((acc, v) => acc + v.valoracion, 0) / valoraciones.length : 0;
      const ingresosMes = Number(reportesRes.data.data?.montoTotal ?? 0);

      setReservasHoy(reservas);
      setMetricas({ reservasHoy: reservas.length, ingresosMes, barberos: barberosRes.data.data.length, promedioValoracion: Number(promedioValoracion.toFixed(1)) });
    });
  }, []);

  const tarjetas = [
    { label: 'Reservas hoy', value: metricas.reservasHoy, icon: <CalendarMonth />, color: '#1976d2' },
    { label: 'Ingresos del mes', value: `S/. ${metricas.ingresosMes}`, icon: <AttachMoney />, color: '#2e7d32' },
    { label: 'Barberos activos', value: metricas.barberos, icon: <ContentCut />, color: '#ed6c02' },
    { label: 'Promedio valoración', value: `${metricas.promedioValoracion}`, icon: <StarRate />, color: '#9c27b0' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: '1.45rem', sm: '1.5rem' } }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Resumen diario de reservas, ingresos y actividad del negocio.
        </Typography>
      </Box>

      {/* Tarjetas de métricas */}
      <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: 4 }}>
        {tarjetas.map((t) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={t.label}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.25, sm: 2 }, p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ color: t.color, fontSize: { xs: 30, sm: 40 }, display: 'flex', alignItems: 'center' }}>{t.icon}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                    {t.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.25 }}>
                    {t.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabla reservas del día */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Reservas de hoy
      </Typography>
      <Box sx={{ display: { xs: 'grid', sm: 'none' }, gap: 1.5 }}>
        {reservasHoy.map((r) => (
          <Card key={r.id} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                      {r.cliente}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.hora}
                    </Typography>
                  </Box>
                  <Chip label={r.estado} color={estadoColor[r.estado]} size="small" />
                </Box>
                <Typography variant="body2">
                  <strong>Barbero:</strong> {r.barbero}
                </Typography>
                <Typography variant="body2">
                  <strong>Servicio:</strong> {r.servicio}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
        {reservasHoy.length === 0 && (
          <Paper sx={{ borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No hay reservas para hoy
            </Typography>
          </Paper>
        )}
      </Box>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', display: { xs: 'none', sm: 'block' } }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(15, 23, 42, 0.04)' }}>
              <TableCell>Cliente</TableCell>
              <TableCell>Barbero</TableCell>
              <TableCell>Servicio</TableCell>
              <TableCell>Hora</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reservasHoy.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.cliente}</TableCell>
                <TableCell>{r.barbero}</TableCell>
                <TableCell>{r.servicio}</TableCell>
                <TableCell>{r.hora}</TableCell>
                <TableCell>
                  <Chip label={r.estado} color={estadoColor[r.estado]} size="small" />
                </TableCell>
              </TableRow>
            ))}
            {reservasHoy.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No hay reservas para hoy
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
