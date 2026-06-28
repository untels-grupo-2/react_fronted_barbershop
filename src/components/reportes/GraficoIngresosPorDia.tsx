import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Box, Typography } from '@mui/material';
import type { PuntoIngresoDia } from '../../types';

/** Gráfico de barras de ingresos por día. Muestra un placeholder si no hay datos. */
export default function GraficoIngresosPorDia({ datos }: { datos: PuntoIngresoDia[] }) {
  if (datos.length === 0) {
    return (
      <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Sin desglose diario disponible.
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="fecha" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip formatter={(valor) => [`S/. ${Number(valor).toFixed(2)}`, 'Ingreso']} />
        <Bar dataKey="monto" fill="#1976d2" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
