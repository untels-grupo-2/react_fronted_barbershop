import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, Typography } from '@mui/material';
import { TURNOS } from '../../types';
import type { ActualizarTurnosDiaRequest, Barbero, DiaSemana, HorarioSemana } from '../../types';

interface PrepararDiaDialogProps {
  open: boolean;
  dia: DiaSemana | null;
  barberos: Barbero[];
  semana: HorarioSemana;
  guardando: boolean;
  onClose: () => void;
  onGuardar: (request: ActualizarTurnosDiaRequest) => void;
}

/** Selección de barberos por turno (mapa tipoHorarioId -> set de barberoId). */
type SeleccionPorTurno = Record<number, Set<number>>;

/**
 * Diálogo para preparar los turnos de un día (PB-35).
 *
 * Replica el popup de la app móvil: por cada turno, una lista de barberos con
 * checkbox para marcar quiénes trabajan. Precarga la selección actual a partir
 * del horario de la semana (cruzando por nombre, que es lo que entrega el backend).
 */
export default function PrepararDiaDialog({ open, dia, barberos, semana, guardando, onClose, onGuardar }: PrepararDiaDialogProps) {
  const [seleccion, setSeleccion] = useState<SeleccionPorTurno>({});

  // Selección inicial: barberos ya asignados a cada turno de ese día.
  const seleccionInicial = useMemo<SeleccionPorTurno>(() => {
    const base: SeleccionPorTurno = {};
    const turnosDelDia = dia ? (semana[dia] ?? {}) : {};
    for (const turno of TURNOS) {
      const nombresAsignados = turnosDelDia[turno.nombre] ?? [];
      const ids = barberos.filter((b) => nombresAsignados.includes(b.nombre)).map((b) => b.id);
      base[turno.tipoHorarioId] = new Set(ids);
    }
    return base;
  }, [dia, semana, barberos]);

  useEffect(() => {
    if (open) setSeleccion(seleccionInicial);
  }, [open, seleccionInicial]);

  const toggleBarbero = (tipoHorarioId: number, barberoId: number) => {
    setSeleccion((prev) => {
      const set = new Set(prev[tipoHorarioId] ?? []);
      if (set.has(barberoId)) set.delete(barberoId);
      else set.add(barberoId);
      return { ...prev, [tipoHorarioId]: set };
    });
  };

  const handleGuardar = () => {
    if (!dia) return;
    const turnosPorTipo: Record<number, number[]> = {};
    for (const turno of TURNOS) {
      turnosPorTipo[turno.tipoHorarioId] = Array.from(seleccion[turno.tipoHorarioId] ?? []);
    }
    onGuardar({ dia, turnosPorTipo });
  };

  return (
    <Dialog open={open} onClose={guardando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Preparación {dia ? dia.charAt(0) + dia.slice(1).toLowerCase() : ''}</DialogTitle>
      <DialogContent dividers>
        {TURNOS.map((turno) => (
          <Box key={turno.tipoHorarioId} sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              {turno.nombre.charAt(0) + turno.nombre.slice(1).toLowerCase()}
            </Typography>
            {barberos.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay barberos registrados.
              </Typography>
            ) : (
              <FormGroup>
                {barberos.map((barbero) => (
                  <FormControlLabel
                    key={barbero.id}
                    control={<Checkbox checked={seleccion[turno.tipoHorarioId]?.has(barbero.id) ?? false} onChange={() => toggleBarbero(turno.tipoHorarioId, barbero.id)} disabled={guardando} />}
                    label={barbero.nombre}
                  />
                ))}
              </FormGroup>
            )}
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={guardando}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleGuardar} disabled={guardando}>
          {guardando ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
