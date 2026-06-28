import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Tab, Tabs, Typography } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useHorarios } from '../hooks/useHorarios';
import { useGlobalBusy } from '../hooks/useGlobalBusy';
import ConfirmActionDialog from '../components/common/ConfirmActionDialog';
import CalendarioSemana from '../components/horarios/CalendarioSemana';
import PrepararDiaDialog from '../components/horarios/PrepararDiaDialog';
import type { DiaSemana } from '../types';

type VistaHorario = 'actual' | 'proxima';

export default function HorariosPage() {
  const { semanaActual, proximaSemana, barberos, cargando, guardarTurnosDia, confirmarSemana } = useHorarios();
  const { isGlobalBusy } = useGlobalBusy();
  const [vista, setVista] = useState<VistaHorario>('proxima');
  const [diaPreparar, setDiaPreparar] = useState<DiaSemana | null>(null);
  const [confirmarOpen, setConfirmarOpen] = useState(false);

  const handleGuardar = async (request: Parameters<typeof guardarTurnosDia>[0]) => {
    await guardarTurnosDia(request);
    setDiaPreparar(null);
  };

  const handleConfirmar = async () => {
    await confirmarSemana();
    setConfirmarOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: '1.45rem', sm: '1.5rem' } }}>
            Horarios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organiza qué barberos trabajan en cada turno de la próxima semana.
          </Typography>
        </Box>
        {vista === 'proxima' && (
          <Button variant="contained" disableElevation startIcon={<CheckCircle />} onClick={() => setConfirmarOpen(true)} disabled={isGlobalBusy} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Confirmar próxima semana
          </Button>
        )}
      </Box>

      <Tabs value={vista} onChange={(_, v) => setVista(v as VistaHorario)} sx={{ mb: 2 }}>
        <Tab value="proxima" label="Próxima semana" />
        <Tab value="actual" label="Semana actual" />
      </Tabs>

      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : vista === 'proxima' ? (
        <>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Aquí preparas el horario de la <strong>próxima semana</strong>. Usa “Preparar” en cada día para asignar barberos y luego “Confirmar próxima semana”.
          </Alert>
          <CalendarioSemana semana={proximaSemana} editable deshabilitado={isGlobalBusy} onPreparar={(dia) => setDiaPreparar(dia)} />
        </>
      ) : (
        <>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            El horario de la <strong>semana actual</strong> es solo de consulta y no puede modificarse.
          </Alert>
          <CalendarioSemana semana={semanaActual} />
        </>
      )}

      <PrepararDiaDialog open={diaPreparar !== null} dia={diaPreparar} barberos={barberos} semana={proximaSemana} guardando={isGlobalBusy} onClose={() => setDiaPreparar(null)} onGuardar={(req) => void handleGuardar(req)} />

      <ConfirmActionDialog open={confirmarOpen} title="Confirmar próxima semana" description="Se generará el horario de la próxima semana a partir de la preparación actual. ¿Deseas continuar?" confirmLabel="Confirmar" loading={isGlobalBusy} onClose={() => setConfirmarOpen(false)} onConfirm={() => void handleConfirmar()} />
    </Box>
  );
}
