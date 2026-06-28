import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import axiosClient from '../api/axiosClient';
import { actualizarTurnosDia, confirmarHorario, obtenerHorarioProximaSemana, obtenerHorarioSemana } from '../api/horarioService';
import { useNotification } from './useNotification';
import { useGlobalBusy } from './useGlobalBusy';
import type { ActualizarTurnosDiaRequest, Barbero, HorarioSemana, RawBarbero } from '../types';

/**
 * Custom Hook (Facade) del módulo de horarios (PB-35).
 *
 * Consolida las distintas operaciones del backend (consultar semana, listar
 * barberos, actualizar turnos, confirmar semana) tras una sola interfaz, para
 * que la página solo se ocupe de presentar. Replica la lógica de la app móvil.
 */
export const useHorarios = () => {
  const { showError, showSuccess } = useNotification();
  const { runWithGlobalBusy } = useGlobalBusy();
  const [semanaActual, setSemanaActual] = useState<HorarioSemana>({}); // definitiva, solo lectura
  const [proximaSemana, setProximaSemana] = useState<HorarioSemana>({}); // en preparación, editable
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [cargando, setCargando] = useState(false);

  const mensajeBackend = (error: unknown, fallback: string): string => (axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined) ?? fallback;

  const cargarSemanaActual = useCallback(async () => {
    try {
      setSemanaActual(await obtenerHorarioSemana());
    } catch (error) {
      showError(mensajeBackend(error, 'No se pudo cargar el horario actual'));
    }
  }, [showError]);

  const cargarProximaSemana = useCallback(async () => {
    setProximaSemana(await obtenerHorarioProximaSemana());
  }, []);

  const cargarBarberos = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/api/barberos');
      const raw = (data?.data ?? []) as RawBarbero[];
      setBarberos(raw.map((b) => ({ id: b.barbero_id, nombre: b.nombre, urlBarbero: b.urlBarbero })));
    } catch (error) {
      showError(mensajeBackend(error, 'No se pudieron cargar los barberos'));
    }
  }, [showError]);

  useEffect(() => {
    const init = async () => {
      setCargando(true);
      await Promise.all([cargarSemanaActual(), cargarProximaSemana(), cargarBarberos()]);
      setCargando(false);
    };
    void init();
  }, [cargarSemanaActual, cargarProximaSemana, cargarBarberos]);

  /**
   * Guarda los turnos de un día (afecta la PRÓXIMA semana — regla de negocio) y
   * refresca la preparación para reflejar el cambio al instante.
   */
  const guardarTurnosDia = async (request: ActualizarTurnosDiaRequest) => {
    try {
      await runWithGlobalBusy(async () => {
        await actualizarTurnosDia(request);
        showSuccess(`Turnos actualizados para ${request.dia.toLowerCase()}`);
        await cargarProximaSemana();
      });
    } catch (error) {
      showError(mensajeBackend(error, 'No se pudieron guardar los turnos'));
    }
  };

  /** Confirma la preparación como horario oficial de la próxima semana. */
  const confirmarSemana = async () => {
    try {
      await runWithGlobalBusy(async () => {
        await confirmarHorario();
        showSuccess('Horario confirmado para la próxima semana');
        await cargarProximaSemana();
      });
    } catch (error) {
      showError(mensajeBackend(error, 'No se pudo confirmar el horario'));
    }
  };

  return { semanaActual, proximaSemana, barberos, cargando, guardarTurnosDia, confirmarSemana };
};
