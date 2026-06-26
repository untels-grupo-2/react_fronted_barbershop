import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Box, Typography } from '@mui/material';
import type { PorcionServicio } from '../../types';

// Paleta consistente con el resto del panel (MUI palette base).
const COLORES = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#0288d1', '#d32f2f', '#7b1fa2', '#00796b'];

/** Gráfico de pastel con la distribución de ingresos por servicio. */
export default function GraficoDistribucionServicios({ datos }: { datos: PorcionServicio[] }) {
  if (datos.length === 0) {
    return (
      <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Sin datos por servicio.
        </Typography>
      </Box>
    );
  }

  return (
    // Más altura para separar el pastel de la leyenda. Sin etiquetas alrededor
    // del pastel (se cortaban y duplicaban la leyenda): la leyenda inferior basta.
    <ResponsiveContainer width="100%" height={320}>
      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Pie data={datos} dataKey="monto" nameKey="servicioNombre" cx="50%" cy="45%" innerRadius={52} outerRadius={92} paddingAngle={2} cornerRadius={4}>
          {datos.map((porcion, index) => (
            <Cell key={porcion.servicioNombre} fill={COLORES[index % COLORES.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(valor) => [`S/. ${Number(valor).toFixed(2)}`, 'Ingreso']} />
        <Legend verticalAlign="bottom" height={48} iconType="circle" wrapperStyle={{ paddingTop: 16, fontSize: 13 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
