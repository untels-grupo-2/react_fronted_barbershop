import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Chip, Table, TableBody, TableCell, TableHead, TableRow, Paper, Box } from '@mui/material';
import { CalendarMonth, AttachMoney, ContentCut, StarRate } from '@mui/icons-material';
import axiosClient from '../api/axiosClient';

interface ReservaHoy {
  id: number;
  cliente: string;
  barbero: string;
  servicio: string;
  hora: string;
  estado: 'CREADA' | 'CONFIRMADA' | 'REALIZADA' | 'CANCELADA';
}

interface ReservaBackend {
  reservaId: number;
  usuarioNombre: string;
  barberoNombre: string;
  servicioNombre: string;
  horarioRango: string;
  estado: 'CREADA' | 'CONFIRMADA' | 'REALIZADA' | 'CANCELADA';
}

const estadoColor: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  CREADA: 'default',
  CONFIRMADA: 'warning',
  REALIZADA: 'success',
  CANCELADA: 'error',
};

export default function DashboardPage() {
  const [reservasHoy, setReservasHoy] = useState<ReservaHoy[]>([]);
  const [metricas, setMetricas] = useState({ reservasHoy: 0, ingresosMes: 0, barberos: 0, promedioValoracion: 0 });

  useEffect(() => {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const now = new Date();
    const hoy = formatDate(now);
    const inicioMes = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    // Llamadas paralelas al backend
    Promise.all([
      axiosClient.get(`/api/reservas/admin?fecha=${hoy}`),
      axiosClient.get('/api/barberos'),
      axiosClient.get('/api/valoraciones'),
      axiosClient.get('/api/reservas/reportes', { params: { fechaInicio: inicioMes, fechaFin: hoy } }),
    ]).then(([reservasRes, barberosRes, valoracionRes, reportesRes]) => {
      const reservas = (reservasRes.data.data as ReservaBackend[]).map((item) => ({
        id: item.reservaId,
        cliente: item.usuarioNombre,
        barbero: item.barberoNombre,
        servicio: item.servicioNombre,
        hora: item.horarioRango,
        estado: item.estado,
      }));
      const valoraciones = (valoracionRes.data.data ?? []) as Array<{ valoracion: number }>;
      const promedioValoracion = valoraciones.length > 0 ? valoraciones.reduce((acc, v) => acc + v.valoracion, 0) / valoraciones.length : 0;
      const ingresosMes = Number(reportesRes.data.data?.montoTotal ?? 0);

      setReservasHoy(reservas);
      setMetricas({
        reservasHoy: reservas.length,
        ingresosMes,
        barberos: barberosRes.data.data.length,
        promedioValoracion: Number(promedioValoracion.toFixed(1)),
      });
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
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Dashboard
      </Typography>

      {/* Tarjetas de métricas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {tarjetas.map((t) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={t.label}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: t.color, fontSize: 40 }}>{t.icon}</Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {t.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
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
      <Paper>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
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
