import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Paper, Rating, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import axios from 'axios';
import axiosClient from '../api/axiosClient';

interface RawValoracion {
  valoracion_id: number;
  usuarioId: number;
  celular: string;
  valoracion: number;
  util: boolean;
  estado?: number;
  mensaje: string;
  usuario_nombre: string;
}

interface Valoracion {
  id: number;
  usuarioId: number;
  celular: string;
  rating: number;
  pendiente: boolean;
  mensaje: string;
  clienteNombre: string;
}

const normalizarCelular = (celular: string) => celular.replace(/\D/g, '');

const construirMensajeWhatsapp = (valoracion: Valoracion) => {
  return `Hola ${valoracion.clienteNombre}, gracias por tu valoración de ${valoracion.rating} estrellas sobre tu experiencia en Diamond BarberHub. Tu feedback nos ayuda a mejorar continuamente el proceso de reserva y atención.`;
};

export default function ValoracionesPage() {
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [loading, setLoading] = useState(false);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [tab, setTab] = useState(0);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/api/valoraciones');
      const raw = (response.data?.data ?? []) as RawValoracion[];
      const mapped = raw.map((item) => {
        const estadoNormalizado = Number.isInteger(item.estado) ? Number(item.estado) : item.util ? 1 : 0;
        return { id: item.valoracion_id, usuarioId: item.usuarioId, celular: item.celular, rating: item.valoracion, pendiente: estadoNormalizado === 1, mensaje: item.mensaje, clienteNombre: item.usuario_nombre };
      });
      setValoraciones(mapped);
    } catch (error: unknown) {
      const backendMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
      alert(backendMessage ?? 'No se pudieron obtener las valoraciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await cargar();
    };
    void init();
  }, [cargar]);

  const pendientes = useMemo(() => valoraciones.filter((v) => v.pendiente), [valoraciones]);
  const respondidas = useMemo(() => valoraciones.filter((v) => !v.pendiente), [valoraciones]);
  const visibles = tab === 0 ? pendientes : respondidas;

  const responderPorWhatsapp = async (valoracion: Valoracion) => {
    const telefono = normalizarCelular(valoracion.celular);
    if (!telefono) {
      alert('No se encontró un número de celular válido para este cliente');
      return;
    }

    const mensaje = construirMensajeWhatsapp(valoracion);
    const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    setProcesandoId(valoracion.id);
    try {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      await axiosClient.patch(`/api/valoraciones/${valoracion.id}/estado`);
      await cargar();
    } catch (error: unknown) {
      const backendMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
      alert(backendMessage ?? 'No se pudo actualizar el estado de la valoración');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Valoraciones
        </Typography>
        <Button variant="outlined" onClick={() => void cargar()} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label={`Pendientes (${pendientes.length})`} />
          <Tab label={`Respondidas (${respondidas.length})`} />
        </Tabs>
      </Paper>

      <Paper>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>Cliente</TableCell>
              <TableCell>Valoración</TableCell>
              <TableCell>Comentario</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibles.map((valoracion) => (
              <TableRow key={valoracion.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {valoracion.clienteNombre}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Rating value={valoracion.rating} precision={1} readOnly />
                </TableCell>
                <TableCell sx={{ maxWidth: 340 }}>{valoracion.mensaje || '-'}</TableCell>
                <TableCell>
                  <Chip size="small" color={valoracion.pendiente ? 'warning' : 'success'} label={valoracion.pendiente ? 'Pendiente' : 'Respondida'} />
                </TableCell>
                <TableCell align="center">
                  {valoracion.pendiente ? (
                    <Button size="small" variant="contained" startIcon={<WhatsAppIcon />} onClick={() => void responderPorWhatsapp(valoracion)} disabled={procesandoId === valoracion.id}>
                      {procesandoId === valoracion.id ? 'Enviando...' : 'Responder'}
                    </Button>
                  ) : (
                    '-'
                  )}
                </TableCell>
              </TableRow>
            ))}
            {visibles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {tab === 0 ? 'No hay valoraciones pendientes' : 'No hay valoraciones respondidas'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
