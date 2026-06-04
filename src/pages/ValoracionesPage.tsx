import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Chip, Paper, Rating, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography, Card, CardContent, Stack } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import axios from 'axios';
import axiosClient from '../api/axiosClient';
import { useNotification } from '../hooks/useNotification.ts';
import { useGlobalBusy } from '../hooks/useGlobalBusy.ts';
import type { RawValoracion, Valoracion } from '../types';

const normalizarCelular = (celular: string) => celular.replace(/\D/g, '');

const construirMensajeWhatsapp = (valoracion: Valoracion) => {
  return `Hola ${valoracion.clienteNombre}, gracias por tu valoración de ${valoracion.rating} estrellas sobre tu experiencia en Diamond BarberHub. Tu feedback nos ayuda a mejorar continuamente el proceso de reserva y atención.`;
};

export default function ValoracionesPage() {
  const { showError } = useNotification();
  const { isGlobalBusy, runWithGlobalBusy } = useGlobalBusy();
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [loading, setLoading] = useState(false);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [tab, setTab] = useState(0);
  const procesandoRef = useRef(false);

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
      showError(backendMessage ?? 'No se pudieron obtener las valoraciones');
    } finally {
      setLoading(false);
    }
  }, [showError]);

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
    if (procesandoRef.current) {
      return;
    }

    const telefono = normalizarCelular(valoracion.celular);
    if (!telefono) {
      showError('No se encontro un numero de celular valido para este cliente');
      return;
    }

    const mensaje = construirMensajeWhatsapp(valoracion);
    const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    procesandoRef.current = true;
    setProcesandoId(valoracion.id);
    try {
      await runWithGlobalBusy(async () => {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        await axiosClient.patch(`/api/valoraciones/${valoracion.id}/estado`);
        await cargar();
      });
    } catch (error: unknown) {
      const backendMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
      showError(backendMessage ?? 'No se pudo actualizar el estado de la valoracion');
    } finally {
      procesandoRef.current = false;
      setProcesandoId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: '1.45rem', sm: '1.5rem' } }}>
            Valoraciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Revisa feedback pendiente y responde rapidamente por WhatsApp.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => void cargar()} disabled={loading || isGlobalBusy} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </Box>

      <Paper sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth">
          <Tab label={`Pendientes (${pendientes.length})`} />
          <Tab label={`Respondidas (${respondidas.length})`} />
        </Tabs>
      </Paper>

      <Box sx={{ display: { xs: 'grid', sm: 'none' }, gap: 1.5 }}>
        {visibles.map((valoracion) => (
          <Card key={valoracion.id} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack spacing={1.25}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, wordBreak: 'break-word', minWidth: 0 }}>
                    {valoracion.clienteNombre}
                  </Typography>
                  <Chip size="small" color={valoracion.pendiente ? 'warning' : 'success'} label={valoracion.pendiente ? 'Pendiente' : 'Respondida'} />
                </Box>
                <Rating value={valoracion.rating} precision={1} readOnly />
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                  {valoracion.mensaje || '-'}
                </Typography>
                {valoracion.pendiente ? (
                  <Button size="small" variant="contained" startIcon={<WhatsAppIcon />} onClick={() => void responderPorWhatsapp(valoracion)} disabled={procesandoId === valoracion.id || isGlobalBusy} sx={{ alignSelf: 'stretch' }}>
                    {procesandoId === valoracion.id ? 'Enviando...' : 'Responder'}
                  </Button>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        ))}
        {visibles.length === 0 && (
          <Paper sx={{ borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {tab === 0 ? 'No hay valoraciones pendientes' : 'No hay valoraciones respondidas'}
            </Typography>
          </Paper>
        )}
      </Box>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', display: { xs: 'none', sm: 'block' } }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(15, 23, 42, 0.04)' }}>
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
                    <Button size="small" variant="contained" startIcon={<WhatsAppIcon />} onClick={() => void responderPorWhatsapp(valoracion)} disabled={procesandoId === valoracion.id || isGlobalBusy}>
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
