import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Add, Delete, Edit } from '@mui/icons-material';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography, Card, CardContent, Stack } from '@mui/material';
import axiosClient, { postWithFile, putWithFile } from '../api/axiosClient';
import { useNotification } from '../hooks/useNotification.ts';
import ConfirmActionDialog from '../components/common/ConfirmActionDialog';
import { useGlobalBusy } from '../hooks/useGlobalBusy.ts';
import type { Barbero, RawBarbero } from '../types';

const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024;

export default function BarberosPage() {
  const { showError, showSuccess } = useNotification();
  const { isGlobalBusy, runWithGlobalBusy } = useGlobalBusy();
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editando, setEditando] = useState<Barbero | null>(null);
  const [form, setForm] = useState({ nombre: '' });
  const [imagen, setImagen] = useState<File | null>(null);
  const [barberoADeshabilitarId, setBarberoADeshabilitarId] = useState<number | null>(null);
  const [deshabilitandoBarbero, setDeshabilitandoBarbero] = useState(false);
  const [guardandoBarbero, setGuardandoBarbero] = useState(false);
  const guardandoBarberoRef = useRef(false);
  const deshabilitandoBarberoRef = useRef(false);

  const cargar = useCallback(() => {
    return axiosClient.get('/api/barberos').then((response) => {
      const data = (response.data?.data ?? []) as RawBarbero[];
      const mapped = data.map((item) => ({ id: item.barbero_id, nombre: item.nombre, urlBarbero: item.urlBarbero }));
      setBarberos(mapped);
    });
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ nombre: '' });
    setImagen(null);
    setOpenForm(true);
  };

  const abrirEditar = (barbero: Barbero) => {
    setEditando(barbero);
    setForm({ nombre: barbero.nombre });
    setImagen(null);
    setOpenForm(true);
  };

  const cerrarFormulario = () => {
    setOpenForm(false);
    setEditando(null);
    setForm({ nombre: '' });
    setImagen(null);
  };

  const guardar = async () => {
    if (guardandoBarberoRef.current) {
      return;
    }

    const nombre = form.nombre.trim();

    if (!nombre) {
      showError('Ingresa el nombre del barbero');
      return;
    }

    if (imagen) {
      if (!imagen.type.startsWith('image/')) {
        showError('Solo se permiten archivos de imagen');
        return;
      }

      if (imagen.size > MAX_IMAGE_SIZE_BYTES) {
        showError('La imagen excede el tamano permitido (maximo 1 MB)');
        return;
      }
    }

    guardandoBarberoRef.current = true;
    setGuardandoBarbero(true);
    try {
      await runWithGlobalBusy(async () => {
        const dtoBarbero = { nombre };
        const formData = new FormData();
        formData.append('dtoBarbero', new Blob([JSON.stringify(dtoBarbero)], { type: 'application/json' }), 'dtoBarbero.json');

        if (imagen) {
          formData.append('imagen', imagen, imagen.name);
        }

        if (editando) {
          await putWithFile(`/api/barberos/${editando.id}`, formData);
        } else {
          await postWithFile('/api/barberos', formData);
        }

        cerrarFormulario();
        showSuccess(editando ? 'Barbero actualizado correctamente' : 'Barbero creado correctamente');
        await cargar();
      });
    } catch (error: unknown) {
      const backendMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
      showError(backendMessage ?? 'No se pudo guardar el barbero');
    } finally {
      guardandoBarberoRef.current = false;
      setGuardandoBarbero(false);
    }
  };

  const eliminar = async () => {
    if (!barberoADeshabilitarId) {
      return;
    }

    if (deshabilitandoBarberoRef.current) {
      return;
    }

    deshabilitandoBarberoRef.current = true;
    setDeshabilitandoBarbero(true);
    try {
      await runWithGlobalBusy(async () => {
        await axiosClient.delete(`/api/barberos/${barberoADeshabilitarId}`);
        showSuccess('Barbero deshabilitado correctamente');
        await cargar();
        setBarberoADeshabilitarId(null);
      });
    } catch (error: unknown) {
      const backendMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
      showError(backendMessage ?? 'No se pudo deshabilitar el barbero');
    } finally {
      deshabilitandoBarberoRef.current = false;
      setDeshabilitandoBarbero(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: '1.45rem', sm: '1.5rem' } }}>
            Barberos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra el equipo y actualiza su informacion visual.
          </Typography>
        </Box>
        <Button variant="contained" disableElevation startIcon={<Add />} onClick={abrirNuevo} disabled={isGlobalBusy} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Nuevo Barbero
        </Button>
      </Box>

      <Box sx={{ display: { xs: 'grid', sm: 'none' }, gap: 1.5 }}>
        {barberos.map((barbero) => (
          <Card key={barbero.id} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack spacing={1.25}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, wordBreak: 'break-word', minWidth: 0 }}>
                    {barbero.nombre}
                  </Typography>
                  {barbero.urlBarbero ? (
                    <Box component="img" src={barbero.urlBarbero} alt={barbero.nombre} sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Sin imagen
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <IconButton size="small" onClick={() => abrirEditar(barbero)} disabled={isGlobalBusy}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setBarberoADeshabilitarId(barbero.id)} disabled={isGlobalBusy}>
                    <Delete />
                  </IconButton>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
        {barberos.length === 0 && (
          <Paper sx={{ borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No hay barberos registrados
            </Typography>
          </Paper>
        )}
      </Box>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', display: { xs: 'none', sm: 'block' } }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(15, 23, 42, 0.04)' }}>
              <TableCell>Nombre</TableCell>
              <TableCell>Imagen</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {barberos.map((barbero) => (
              <TableRow key={barbero.id}>
                <TableCell>{barbero.nombre}</TableCell>
                <TableCell>{barbero.urlBarbero ? <Box component="img" src={barbero.urlBarbero} alt={barbero.nombre} sx={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 1 }} /> : '-'}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar">
                    <IconButton onClick={() => abrirEditar(barbero)} disabled={isGlobalBusy}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Deshabilitar">
                    <IconButton color="error" onClick={() => setBarberoADeshabilitarId(barbero.id)} disabled={isGlobalBusy}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {barberos.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No hay barberos registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={openForm} onClose={guardandoBarbero || isGlobalBusy ? undefined : cerrarFormulario} maxWidth="sm" fullWidth>
        <DialogTitle>{editando ? 'Editar Barbero' : 'Nuevo Barbero'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, px: { xs: 2, sm: 3 } }}>
          <TextField label="Nombre" value={form.nombre} onChange={(event) => setForm({ nombre: event.target.value })} fullWidth />
          {editando?.urlBarbero && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">Imagen actual:</Typography>
              <Box component="img" src={editando.urlBarbero} alt={editando.nombre} sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1 }} />
            </Box>
          )}
          <Box>
            <input type="file" accept="image/*" onChange={(event) => setImagen(event.target.files?.[0] || null)} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {editando ? 'Selecciona una nueva imagen solo si deseas reemplazar la actual.' : 'Selecciona una imagen si deseas asociarla al barbero.'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarFormulario} disabled={guardandoBarbero || isGlobalBusy}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void guardar()} disabled={guardandoBarbero || isGlobalBusy}>
            {guardandoBarbero ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmActionDialog
        open={barberoADeshabilitarId !== null}
        title="Deshabilitar barbero"
        description="Esta accion deshabilitara el barbero seleccionado. Deseas continuar?"
        confirmLabel={deshabilitandoBarbero ? 'Deshabilitando...' : 'Deshabilitar'}
        cancelLabel="Cancelar"
        loading={deshabilitandoBarbero || isGlobalBusy}
        onClose={() => setBarberoADeshabilitarId(null)}
        onConfirm={() => void eliminar()}
      />
    </Box>
  );
}
