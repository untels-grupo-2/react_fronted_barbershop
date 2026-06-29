import { useState } from 'react';
import axios from 'axios';
import { Box, Button, Chip, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { FilterAltOff } from '@mui/icons-material';
import { cambiarEstadoReserva } from '../api/reservaService';
import { useReservasFiltradas } from '../hooks/useReservasFiltradas';
import { useNotification } from '../hooks/useNotification';
import { calcularRango, type PresetPeriodo } from '../lib/rangoFechas';
import ReservaDetalleDialog from '../components/reservas/ReservaDetalleDialog';
import { COLOR_ESTADO } from '../components/reservas/estadoReserva';
import { ESTADOS_RESERVA } from '../types';
import type { EstadoReserva, FiltroReservas, ReservaAdmin } from '../types';

// Atajos de fecha de reservas: subconjunto de los presets de reportes (deriva
// del tipo existente, no redeclara los valores).
type AtajoReserva = Extract<PresetPeriodo, 'dia' | 'semana' | 'mes'>;

export default function ReservasPage() {
  const { reservas, totalElements, loading, page, size, setPage, aplicarFiltro, actualizarEstadoLocal } = useReservasFiltradas();
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState<FiltroReservas>({});
  const [atajo, setAtajo] = useState<AtajoReserva | null>(null);
  const [seleccionada, setSeleccionada] = useState<ReservaAdmin | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Aplica un atajo de fecha: solo rellena el rango en los inputs (reutiliza
  // calcularRango). El filtrado se dispara con "Filtrar", igual que en Reportes.
  const aplicarAtajo = (nuevo: AtajoReserva | null) => {
    if (!nuevo) return;
    setAtajo(nuevo);
    const { fechaInicio, fechaFin } = calcularRango(nuevo);
    setForm((prev) => ({ ...prev, fechaDesde: fechaInicio, fechaHasta: fechaFin }));
  };

  // Editar una fecha a mano desmarca el atajo activo.
  const setFecha = (campo: 'fechaDesde' | 'fechaHasta', valor: string) => {
    setAtajo(null);
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const buscar = () => {
    const fechaDesde = form.fechaDesde || undefined;
    const fechaHasta = form.fechaHasta || undefined;

    // Aviso: filtrar sin ningún filtro seleccionado.
    if (!form.estado && !fechaDesde && !fechaHasta) {
      showError('Selecciona al menos un filtro para buscar');
      return;
    }
    // Validación: "Hasta" no puede ser anterior a "Desde".
    if (fechaDesde && fechaHasta && fechaHasta < fechaDesde) {
      showError('La fecha "Hasta" no puede ser anterior a "Desde"');
      return;
    }

    aplicarFiltro({ estado: form.estado, fechaDesde, fechaHasta });
  };

  const limpiar = () => {
    setForm({});
    setAtajo(null);
    aplicarFiltro({});
  };

  const handleCambiarEstado = async (id: number, estado: EstadoReserva, motivo?: string) => {
    setGuardando(true);
    try {
      await cambiarEstadoReserva(id, estado, motivo);
      // Actualiza la fila en su sitio (sin recargar) para no perder la posición
      // en la lista; el cambio queda visible donde estaba la fila.
      actualizarEstadoLocal(id, estado, motivo);
      setSeleccionada(null); // cierra el modal
      showSuccess('Estado de la reserva actualizado');
    } catch (error: unknown) {
      const backendMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
      showError(backendMessage ?? 'No se pudo cambiar el estado');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: '1.45rem', sm: '1.5rem' } }}>
          Reservas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Consulta y gestiona todas las reservas. Filtra y haz clic en una fila para ver el detalle.
        </Typography>
      </Box>

      {/* Filtros */}
      <Paper sx={{ borderRadius: 2, p: { xs: 2, sm: 2.5 }, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="estado-label">Estado</InputLabel>
              <Select labelId="estado-label" label="Estado" value={form.estado ?? ''} onChange={(e) => setForm({ ...form, estado: (e.target.value || undefined) as EstadoReserva | undefined })}>
                <MenuItem value="">Todos</MenuItem>
                {ESTADOS_RESERVA.map((estado) => (
                  <MenuItem key={estado} value={estado}>
                    {estado}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Desde" type="date" size="small" value={form.fechaDesde ?? ''} onChange={(e) => setFecha('fechaDesde', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Hasta" type="date" size="small" value={form.fechaHasta ?? ''} onChange={(e) => setFecha('fechaHasta', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" disableElevation onClick={buscar} disabled={loading} sx={{ flex: 1 }}>
                Filtrar
              </Button>
              <Button variant="outlined" startIcon={<FilterAltOff />} onClick={limpiar} disabled={loading} sx={{ flex: 1 }}>
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Atajos de fecha: aceleran el filtro por rango (reutilizan calcularRango). */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Atajos:
          </Typography>
          <ToggleButtonGroup value={atajo} exclusive onChange={(_, valor) => aplicarAtajo(valor)} size="small" sx={{ flexWrap: 'wrap', gap: 0.75, '& .MuiToggleButton-root': { border: '1px solid', borderColor: 'divider', borderRadius: '999px !important', px: 2, py: 0.4, textTransform: 'none' } }}>
            <ToggleButton value="dia">Hoy</ToggleButton>
            <ToggleButton value="semana">Esta semana</ToggleButton>
            <ToggleButton value="mes">Este mes</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Tabla */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(15, 23, 42, 0.04)' }}>
                <TableCell>ID</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Barbero</TableCell>
                <TableCell>Servicio</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Hora</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : reservas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No hay reservas para los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                reservas.map((r) => (
                  <TableRow key={r.id} hover onClick={() => setSeleccionada(r)} sx={{ cursor: 'pointer' }}>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.cliente}</TableCell>
                    <TableCell>{r.barbero}</TableCell>
                    <TableCell>{r.servicio}</TableCell>
                    <TableCell>{r.fecha}</TableCell>
                    <TableCell>{r.hora}</TableCell>
                    <TableCell>
                      <Chip label={r.estado} color={COLOR_ESTADO[r.estado]} size="small" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={totalElements} page={page} onPageChange={(_, nuevaPagina) => setPage(nuevaPagina)} rowsPerPage={size} rowsPerPageOptions={[size]} labelRowsPerPage="Por página:" labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`} />
      </Paper>

      <ReservaDetalleDialog reserva={seleccionada} guardando={guardando} onClose={() => setSeleccionada(null)} onCambiarEstado={(id, estado, motivo) => void handleCambiarEstado(id, estado, motivo)} />
    </Box>
  );
}
