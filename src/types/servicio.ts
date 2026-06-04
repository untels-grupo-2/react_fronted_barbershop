export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tipoServicio_id?: number;
  nombreTipoServicio?: string;
  urlServicio?: string;
}

export interface RawServicio {
  servicio_id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tipoServicio_id?: number;
  nombre_tipoServicio?: string;
  urlServicio?: string;
}

export interface TipoServicioOption {
  id: number;
  nombre: string;
}

export interface RawTipoServicio {
  tipoServicioId: number;
  nombre: string;
}
