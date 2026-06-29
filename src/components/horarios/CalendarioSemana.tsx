import { Box, Button, Card, CardContent, Chip, Paper, Stack, Typography } from '@mui/material';
import { EditCalendar } from '@mui/icons-material';
import { DIAS_SEMANA, TURNOS } from '../../types';
import type { DiaSemana, HorarioSemana } from '../../types';

const tituloCase = (texto: string): string => texto.charAt(0) + texto.slice(1).toLowerCase();

// Color suave de fondo por turno, para diferenciar las filas del calendario.
const COLOR_TURNO: Record<string, string> = {
  MAÑANA: 'rgba(25, 118, 210, 0.06)',
  TARDE: 'rgba(237, 108, 2, 0.06)',
  NOCHE: 'rgba(123, 31, 162, 0.06)',
};

interface CalendarioSemanaProps {
  semana: HorarioSemana;
  /** Si es editable, muestra el botón "Preparar" por día e invoca onPreparar. */
  editable?: boolean;
  deshabilitado?: boolean;
  onPreparar?: (dia: DiaSemana) => void;
}

/** Chips de barberos asignados a un turno, o un placeholder si está vacío. */
function ChipsBarberos({ barberos }: { barberos: string[] }) {
  if (barberos.length === 0) {
    return (
      <Typography variant="caption" color="text.disabled">
        Sin barberos
      </Typography>
    );
  }
  return (
    <>
      {barberos.map((nombre) => (
        <Chip key={nombre} label={nombre} size="small" sx={{ height: 22, fontSize: '0.72rem' }} />
      ))}
    </>
  );
}

/**
 * Calendario semanal (PB-35). Reutilizable por las dos vistas (semana actual
 * solo-lectura y próxima semana editable); el modo lo controla `editable`.
 *
 * Responsive: en escritorio es una grilla turnos × días con los nombres a la
 * vista; en móvil se apila en tarjetas por día (el grid de 7 días no cabe en
 * pantallas angostas).
 */
export default function CalendarioSemana({ semana, editable = false, deshabilitado = false, onPreparar }: CalendarioSemanaProps) {
  const barberosDe = (dia: string, turno: string): string[] => semana[dia]?.[turno] ?? [];
  const gridColumns = `92px repeat(${DIAS_SEMANA.length}, minmax(120px, 1fr))`;

  return (
    <>
      {/* Vista escritorio: grilla turnos × días */}
      <Paper sx={{ borderRadius: 2, p: 2, overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
        <Box sx={{ minWidth: 880 }}>
          {/* Encabezado: esquina + días (con botón "Preparar" si es editable) */}
          <Box sx={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 1, mb: 1 }}>
            <Box />
            {DIAS_SEMANA.map((dia) => (
              <Box key={dia} sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                  {tituloCase(dia)}
                </Typography>
                {editable && (
                  <Button size="small" startIcon={<EditCalendar sx={{ fontSize: 16 }} />} onClick={() => onPreparar?.(dia)} disabled={deshabilitado} sx={{ mt: 0.25, fontSize: '0.7rem', minWidth: 0, px: 1 }}>
                    Preparar
                  </Button>
                )}
              </Box>
            ))}
          </Box>

          {/* Filas por turno: etiqueta + celda por día */}
          {TURNOS.map((turno) => (
            <Box key={turno.tipoHorarioId} sx={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 1, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  {tituloCase(turno.nombre)}
                </Typography>
              </Box>
              {DIAS_SEMANA.map((dia) => {
                const asignados = barberosDe(dia, turno.nombre);
                return (
                  <Box key={dia} sx={{ minHeight: 84, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: asignados.length > 0 ? COLOR_TURNO[turno.nombre] : 'transparent', p: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <ChipsBarberos barberos={asignados} />
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Vista móvil: tarjetas por día */}
      <Box sx={{ display: { xs: 'grid', md: 'none' }, gap: 1.5 }}>
        {DIAS_SEMANA.map((dia) => (
          <Card key={dia} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {tituloCase(dia)}
                </Typography>
                {editable && (
                  <Button size="small" startIcon={<EditCalendar sx={{ fontSize: 16 }} />} onClick={() => onPreparar?.(dia)} disabled={deshabilitado}>
                    Preparar
                  </Button>
                )}
              </Box>
              <Stack spacing={1}>
                {TURNOS.map((turno) => (
                  <Box key={turno.tipoHorarioId} sx={{ borderRadius: 1.5, bgcolor: COLOR_TURNO[turno.nombre], p: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                      {tituloCase(turno.nombre)}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      <ChipsBarberos barberos={barberosDe(dia, turno.nombre)} />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </>
  );
}
