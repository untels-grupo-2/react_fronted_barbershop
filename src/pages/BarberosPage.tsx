import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Add, Delete, Edit } from '@mui/icons-material';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import axiosClient, { postWithFile, putWithFile } from '../api/axiosClient';

interface Barbero {
  id: number;
  nombre: string;
  urlBarbero?: string;
}

interface RawBarbero {
  barbero_id: number;
  nombre: string;
  urlBarbero?: string;
}

const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024;

export default function BarberosPage() {
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editando, setEditando] = useState<Barbero | null>(null);
  const [form, setForm] = useState({ nombre: '' });
  const [imagen, setImagen] = useState<File | null>(null);

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
    const nombre = form.nombre.trim();

    if (!nombre) {
      alert('Ingresa el nombre del barbero');
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
      await cargar();
    } catch (error: unknown) {
      const backendMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
      alert(backendMessage ?? 'No se pudo guardar el barbero');
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Deshabilitar este barbero?')) {
      return;
    }

    try {
      await axiosClient.delete(`/api/barberos/${id}`);
      await cargar();
    } catch (error: unknown) {
      const backendMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
      alert(backendMessage ?? 'No se pudo deshabilitar el barbero');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Barberos
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={abrirNuevo}>
          Nuevo Barbero
        </Button>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
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
                    <IconButton onClick={() => abrirEditar(barbero)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Deshabilitar">
                    <IconButton color="error" onClick={() => eliminar(barbero.id)}>
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

      <Dialog open={openForm} onClose={cerrarFormulario} maxWidth="sm" fullWidth>
        <DialogTitle>{editando ? 'Editar Barbero' : 'Nuevo Barbero'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
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
          <Button onClick={cerrarFormulario}>Cancelar</Button>
          <Button variant="contained" onClick={guardar}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
