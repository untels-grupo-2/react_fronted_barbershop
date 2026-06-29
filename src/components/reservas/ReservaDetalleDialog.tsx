import { useEffect, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, TextField, Typography } from '@mui/material';
import type { EstadoReserva, ReservaAdmin } from '../../types';
import { ACCIONES_POR_ESTADO, COLOR_ESTADO } from './estadoReserva';

interface ReservaDetalleDialogProps {
  reserva: ReservaAdmin | null;
  guardando: boolean;
  onClose: () => void;
  onCambiarEstado: (id: number, estado: EstadoReserva, motivo?: string) => void;
}

/** Fila etiqueta–valor reutilizable dentro del detalle. */
const Dato = ({ label, valor }: { label: string; valor: string | number }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.5 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
      {valor}
    </Typography>
  </Box>
);

/**
 * Detalle de una reserva (PB-36, CA-4): muestra todos los datos, permite cambiar
 * el estado (con motivo si se cancela) y ver el comprobante de pago si existe.
 */
export default function ReservaDetalleDialog({ reserva, guardando, onClose, onCambiarEstado }: ReservaDetalleDialogProps) {
  const [motivo, setMotivo] = useState('');

  // Limpiar el motivo cada vez que se abre otra reserva.
  useEffect(() => {
    setMotivo('');
  }, [reserva?.id]);

  if (!reserva) return null;

  const acciones = ACCIONES_POR_ESTADO[reserva.estado];

  const handleAccion = (destino: EstadoReserva, requiereMotivo: boolean) => {
    if (requiereMotivo && !motivo.trim()) return; // el botón ya está deshabilitado, doble guardia
    onCambiarEstado(reserva.id, destino, requiereMotivo ? motivo.trim() : undefined);
  };

  return (
    <Dialog open onClose={guardando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <span>Reserva #{reserva.id}</span>
        <Chip label={reserva.estado} color={COLOR_ESTADO[reserva.estado]} size="small" />
      </DialogTitle>

      <DialogContent dividers>
        {/* Datos de la reserva */}
        <Dato label="Cliente" valor={reserva.cliente} />
        <Dato label="Barbero" valor={reserva.barbero} />
        <Dato label="Servicio" valor={reserva.servicio} />
        <Dato label="Fecha" valor={reserva.fecha} />
        <Dato label="Hora" valor={reserva.hora} />
        <Dato label="Precio" valor={`S/. ${reserva.precio.toFixed(2)}`} />
        {reserva.adicionales ? <Dato label="Adicionales" valor={reserva.adicionales} /> : null}
        {reserva.motivo ? <Dato label="Motivo" valor={reserva.motivo} /> : null}

        {/* Comprobante de pago */}
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Comprobante de pago
        </Typography>
        {reserva.urlPago ? (
          <Box component="a" href={reserva.urlPago} target="_blank" rel="noopener noreferrer" sx={{ display: 'inline-block' }}>
            <Box component="img" src={reserva.urlPago} alt="Comprobante de pago" sx={{ maxWidth: '100%', maxHeight: 240, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }} />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Sin comprobante subido.
          </Typography>
        )}

        {/* Cambio de estado */}
        {acciones.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Cambiar estado
            </Typography>
            {acciones.some((a) => a.requiereMotivo) && <TextField label="Motivo (requerido para cancelar)" value={motivo} onChange={(e) => setMotivo(e.target.value)} fullWidth size="small" multiline rows={2} sx={{ mb: 1.5 }} disabled={guardando} />}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {acciones.map((accion) => (
                <Button key={accion.destino} variant={accion.destino === 'CANCELADA' ? 'outlined' : 'contained'} color={accion.destino === 'CANCELADA' ? 'error' : 'primary'} disableElevation onClick={() => handleAccion(accion.destino, accion.requiereMotivo)} disabled={guardando || (accion.requiereMotivo && !motivo.trim())}>
                  {accion.label}
                </Button>
              ))}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={guardando}>
          Cerrar
        </Button>
        {guardando && <CircularProgress size={22} sx={{ mr: 1 }} />}
      </DialogActions>
    </Dialog>
  );
}
