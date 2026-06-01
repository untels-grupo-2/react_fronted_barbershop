import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Button, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import axiosClient, { postWithFile, putWithFile } from '../api/axiosClient';

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tipoServicio_id?: number;
  nombreTipoServicio?: string;
  urlServicio?: string;
}

interface RawServicio {
  servicio_id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tipoServicio_id?: number;
  nombre_tipoServicio?: string;
  urlServicio?: string;
}

interface TipoServicioOption {
  id: number;
  nombre: string;
}

interface RawTipoServicio {
  tipoServicioId: number;
  nombre: string;
}

const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024;

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [tiposServicio, setTiposServicio] = useState<TipoServicioOption[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editando, setEditando] = useState<Servicio | null>(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', tipoServicio_id: '' });
  const [imagen, setImagen] = useState<File | null>(null);

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
    const precio = Number(form.precio);
    const tipoServicioId = Number(selectedTipoServicioId);

    if (!Number.isFinite(precio) || precio <= 0) {
      alert('Ingresa un precio válido mayor a 0');
      return;
    }
    if (!Number.isInteger(tipoServicioId) || tipoServicioId <= 0) {
      alert('Ingresa un tipo de servicio válido');
      return;
    }
    if (imagen) {
      if (!imagen.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen');
        return;
      }
      if (imagen.size > MAX_IMAGE_SIZE_BYTES) {
        alert('La imagen excede el tamaño permitido (máximo 1 MB)');
        return;
      }
    }

    try {
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
          alert('Por favor selecciona una imagen para el servicio');
          return;
        }
        const formData = new FormData();
        formData.append('dtoServicio', new Blob([JSON.stringify(dtoServicio)], { type: 'application/json' }), 'dtoServicio.json');
        formData.append('imagen', imagen, imagen.name);
        await postWithFile('/api/servicios', formData);
      }
      setOpenForm(false);
      cargar();
    } catch (error: unknown) {
      const backendMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
      alert(backendMessage ?? 'No se pudo guardar el servicio');
    }
  };

  const eliminar = async (id: number) => {
    if (confirm('¿Eliminar este servicio?')) {
      await axiosClient.delete(`/api/servicios/${id}`);
      cargar();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography sx={{ variant: 'h5', fontWeight: 'bold' }}>Servicios</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={abrirNuevo}>
          Nuevo Servicio
        </Button>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
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
                    <IconButton onClick={() => abrirEditar(s)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton color="error" onClick={() => eliminar(s.id)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog crear/editar */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editando ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
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
          <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
