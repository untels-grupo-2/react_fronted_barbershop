export interface RawValoracion {
  valoracion_id: number;
  usuarioId: number;
  celular: string;
  valoracion: number;
  util: boolean;
  estado?: number;
  mensaje: string;
  usuario_nombre: string;
}

export interface Valoracion {
  id: number;
  usuarioId: number;
  celular: string;
  rating: number;
  pendiente: boolean;
  mensaje: string;
  clienteNombre: string;
}
