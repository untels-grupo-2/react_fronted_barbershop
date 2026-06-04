export type EstadoReserva = 'CREADA' | 'CONFIRMADA' | 'REALIZADA' | 'CANCELADA';

export interface ReservaHoy {
  id: number;
  cliente: string;
  barbero: string;
  servicio: string;
  hora: string;
  estado: EstadoReserva;
}

export interface ReservaBackend {
  reservaId: number;
  usuarioNombre: string;
  barberoNombre: string;
  servicioNombre: string;
  horarioRango: string;
  estado: EstadoReserva;
}
