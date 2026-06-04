import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Box, Button, CircularProgress, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Stack } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import axiosClient, { postWithFile, putWithFile } from '../api/axiosClient';
import { useNotification } from '../hooks/useNotification.ts';
import ConfirmActionDialog from '../components/common/ConfirmActionDialog';
import { useGlobalBusy } from '../hooks/useGlobalBusy.ts';
import type { RawServicio, RawTipoServicio, Servicio, TipoServicioOption } from '../types';

const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024;

export default function ServiciosPage() {
  const { showError, showSuccess } = useNotification();
  const { isGlobalBusy, runWithGlobalBusy } = useGlobalBusy();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [tiposServicio, setTiposServicio] = useState<TipoServicioOption[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editando, setEditando] = useState<Servicio | null>(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', tipoServicio_id: '' });
  const [imagen, setImagen] = useState<File | null>(null);
  const [servicioAEliminarId, setServicioAEliminarId] = useState<number | null>(null);
  const [eliminandoServicio, setEliminandoServicio] = useState(false);
  const [guardandoServicio, setGuardandoServicio] = useState(false);
  const guardandoServicioRef = useRef(false);
  const eliminandoServicioRef = useRef(false);

  const buildTiposFromServicios = (items: Servicio[]): TipoServicioOption[] => {
    const unique = new Map<number, string>();
    items.forEach((s) => {
      if (s.tipoServicio_id && s.nombreTipoServicio) {
        unique.set(s.tipoServicio_id, s.nombreTipoServicio);
      }
    });
    return Array.from(unique.entries()).map(([id, nombre]) => ({ id, nombre }));
  };

  const mergeTipos = (current: TipoServicioOption[], incoming: TipoServicioOption[]): TipoServicioOption[] => {
    const byId = new Map<number, TipoServicioOption>();
    current.forEach((t) => byId.set(t.id, t));
    incoming.forEach((t) => byId.set(t.id, t));
    return Array.from(byId.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  };

  const resolveTipoServicioId = useCallback(
    (servicio: Servicio): string => {
      if (servicio.tipoServicio_id && Number.isFinite(Number(servicio.tipoServicio_id))) {
        return String(servicio.tipoServicio_id);
      }

      if (!servicio.nombreTipoServicio) {
        return '';
      }

      const normalizedNombre = servicio.nombreTipoServicio.trim().toLowerCase();
      const found = tiposServicio.find((tipo) => tipo.nombre.trim().toLowerCase() === normalizedNombre);
      return found ? String(found.id) : '';
    },
    [tiposServicio],
  );

  const cargarTiposServicio = useCallback(async () => {
    try {
      const response = await axiosClient.get('/api/servicios/tipos');
      const raw = (response.data?.data ?? []) as RawTipoServicio[];
      if (!Array.isArray(raw)) {
        return;
      }

      const mapped = raw.filter((t) => Number.isFinite(Number(t.tipoServicioId)) && typeof t.nombre === 'string').map((t) => ({ id: Number(t.tipoServicioId), nombre: t.nombre }));

      if (mapped.length > 0) {
        setTiposServicio((prev) => mergeTipos(prev, mapped));
      }
    } catch {
      // Fallback: si falla el endpoint nuevo, mantenemos tipos inferidos desde servicios.
    }
  }, []);

  const cargar = useCallback(
    () =>
      axiosClient.get('/api/servicios').then((r) => {
        const data = (r.data?.data ?? []) as RawServicio[];
        const mapped = data.map((s) => ({ id: s.servicio_id, nombre: s.nombre, descripcion: s.descripcion, precio: s.precio, tipoServicio_id: s.tipoServicio_id, nombreTipoServicio: s.nombre_tipoServicio, urlServicio: s.urlServicio }));
        setServicios(mapped);
        setTiposServicio((prev) => mergeTipos(prev, buildTiposFromServicios(mapped)));
      }),
    [],
  );
  useEffect(() => {
    const init = async () => {
      await Promise.all([cargar(), cargarTiposServicio()]);
    };
    void init();
  }, [cargar, cargarTiposServicio]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ nombre: '', descripcion: '', precio: '', tipoServicio_id: '' });
    setImagen(null);
    setOpenForm(true);
  };
  const abrirEditar = (s: Servicio) => {
    setEditando(s);
    setForm({ nombre: s.nombre, descripcion: s.descripcion, precio: String(s.precio), tipoServicio_id: resolveTipoServicioId(s) });
    setImagen(null);
    setOpenForm(true);
  };

  const selectedTipoServicioId = form.tipoServicio_id || (editando ? resolveTipoServicioId(editando) : '');

  const guardar = async () => {
    if (guardandoServicioRef.current) {
      return;
    }

    const precio = Number(form.precio);
    const tipoServicioId = Number(selectedTipoServicioId);

    if (!Number.isFinite(precio) || precio <= 0) {
      showError('Ingresa un precio valido mayor a 0');
      return;
    }
    if (!Number.isInteger(tipoServicioId) || tipoServicioId <= 0) {
      showError('Ingresa un tipo de servicio valido');
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

    guardandoServicioRef.current = true;
    setGuardandoServicio(true);
    try {
      await runWithGlobalBusy(async () => {
        const dtoServicio = { nombre: form.nombre, descripcion: form.descripcion, precio, tipoServicio_id: tipoServicioId };

        if (editando) {
          const formData = new FormData();
          formData.append('dtoServicio', new Blob([JSON.stringify(dtoServicio)], { type: 'application/json' }), 'dtoServicio.json');
          if (imagen) {
            formData.append('imagen', imagen, imagen.name);
          }
          await putWithFile(`/api/servicios/${editando.id}`, formData);
        } else {
          if (!imagen) {
            showError('Por favor selecciona una imagen para el servicio');
            return;
          }
          const formData = new FormData();
          formData.append('dtoServicio', new Blob([JSON.stringify(dtoServicio)], { type: 'application/json' }), 'dtoServicio.json');
          formData.append('imagen', imagen, imagen.name);
          await postWithFile('/api/servicios', formData);
        }
        setOpenForm(false);
        showSuccess(editando ? 'Servicio actualizado correctamente' : 'Servicio creado correctamente');
        await cargar();
      });
    } catch (error: unknown) {
      const backendMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
      showError(backendMessage ?? 'No se pudo guardar el servicio');
    } finally {
      guardandoServicioRef.current = false;
      setGuardandoServicio(false);
    }
  };

  const eliminar = async () => {
    if (!servicioAEliminarId) {
      return;
    }

    if (eliminandoServicioRef.current) {
      return;
    }

    eliminandoServicioRef.current = true;
    setEliminandoServicio(true);
    try {
      await runWithGlobalBusy(async () => {
        await axiosClient.delete(`/api/servicios/${servicioAEliminarId}`);
        showSuccess('Servicio eliminado correctamente');
        await cargar();
        setServicioAEliminarId(null);
      });
    } catch (error: unknown) {
      const backendMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
      showError(backendMessage ?? 'No se pudo eliminar el servicio');
    } finally {
      eliminandoServicioRef.current = false;
      setEliminandoServicio(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: '1.45rem', sm: '1.5rem' } }}>
            Servicios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona catalogo, tipo y precio de los servicios publicados.
          </Typography>
        </Box>
        <Button variant="contained" disableElevation startIcon={<Add />} onClick={abrirNuevo} disabled={isGlobalBusy} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Nuevo Servicio
        </Button>
      </Box>

      <Box sx={{ display: { xs: 'grid', sm: 'none' }, gap: 1.5 }}>
        {servicios.map((s) => (
          <Card key={s.id} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack spacing={1.25}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'flex-start' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                      {s.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-word' }}>
                      {s.nombreTipoServicio ?? 'Sin tipo'}
                    </Typography>
                  </Box>
                  {s.urlServicio ? <Box component="img" src={s.urlServicio} alt={s.nombre} sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }} /> : null}
                </Box>
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                  {s.descripcion}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  S/. {s.precio}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <IconButton size="small" onClick={() => abrirEditar(s)} disabled={isGlobalBusy}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setServicioAEliminarId(s.id)} disabled={isGlobalBusy}>
                    <Delete />
                  </IconButton>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
        {servicios.length === 0 && (
          <Paper sx={{ borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No hay servicios registrados
            </Typography>
          </Paper>
        )}
      </Box>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', display: { xs: 'none', sm: 'block' } }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(15, 23, 42, 0.04)' }}>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Imagen</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {servicios.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.nombre}</TableCell>
                <TableCell>{s.descripcion}</TableCell>
                <TableCell>{s.nombreTipoServicio ?? '-'}</TableCell>
                <TableCell>S/. {s.precio}</TableCell>
                <TableCell>{s.urlServicio ? <Box component="img" src={s.urlServicio} alt={s.nombre} sx={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 1 }} /> : '-'}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar">
                    <IconButton onClick={() => abrirEditar(s)} disabled={isGlobalBusy}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton color="error" onClick={() => setServicioAEliminarId(s.id)} disabled={isGlobalBusy}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {servicios.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay servicios registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog crear/editar */}
      <Dialog open={openForm} onClose={guardandoServicio || isGlobalBusy ? undefined : () => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editando ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, px: { xs: 2, sm: 3 } }}>
          <TextField label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} fullWidth />
          <TextField label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} fullWidth multiline rows={2} />
          <TextField label="Precio (S/.)" type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} fullWidth />
          <FormControl fullWidth required>
            <InputLabel id="tipo-servicio-label">Tipo de Servicio</InputLabel>
            <Select labelId="tipo-servicio-label" label="Tipo de Servicio" value={selectedTipoServicioId} onChange={(e) => setForm({ ...form, tipoServicio_id: String(e.target.value) })}>
              {tiposServicio.map((tipo) => (
                <MenuItem key={tipo.id} value={String(tipo.id)}>
                  {tipo.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {editando && editando.urlServicio && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">Imagen actual:</Typography>
              <Box component="img" src={editando.urlServicio} alt={editando.nombre} sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1 }} />
            </Box>
          )}
          <Box>
            <input type="file" accept="image/*" onChange={(e) => setImagen(e.target.files?.[0] || null)} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {editando ? 'Selecciona una nueva imagen solo si deseas reemplazar la actual.' : 'Selecciona la imagen del servicio.'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)} disabled={guardandoServicio || isGlobalBusy}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void guardar()} disabled={guardandoServicio || isGlobalBusy}>
            {guardandoServicio ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmActionDialog open={servicioAEliminarId !== null} title="Eliminar servicio" description="Esta accion eliminara el servicio seleccionado. Deseas continuar?" confirmLabel={eliminandoServicio ? 'Eliminando...' : 'Eliminar'} cancelLabel="Cancelar" loading={eliminandoServicio || isGlobalBusy} onClose={() => setServicioAEliminarId(null)} onConfirm={() => void eliminar()} />
    </Box>
  );
}
