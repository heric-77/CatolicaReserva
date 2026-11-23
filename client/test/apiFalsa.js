// Fábrica do módulo api.js "falso", usada com vi.mock nos testes das telas:
// cada função da API vira um vi.fn() que o teste programa.
import { vi } from 'vitest';

export const METODOS_DA_API = [
  'registrar', 'login',
  'listarSalas', 'criarSala', 'atualizarSala', 'excluirSala',
  'criarReserva', 'editarReserva', 'minhasReservas', 'todasReservas', 'cancelarReserva',
  'agendaDoDia',
  'listarUsuarios', 'alterarTipoUsuario', 'excluirUsuario',
];

export function criarApiFalsa() {
  return {
    EVENTO_SESSAO_EXPIRADA: 'sessao-expirada',
    api: Object.fromEntries(METODOS_DA_API.map((nome) => [nome, vi.fn()])),
  };
}

export const salas = [
  { id: 1, nome: 'Lab 1', tipo: 'LABORATORIO', capacidade: 30, recursos: 'PCs' },
  { id: 2, nome: 'Sala 2', tipo: 'SALA_ESTUDO', capacidade: 4, recursos: '' },
];

export function reserva(dados = {}) {
  return {
    id: 1,
    usuario_id: 7,
    sala_id: 1,
    data: '2026-01-11',
    hora_inicio: '10:00:00',
    hora_fim: '11:00:00',
    status: 'ATIVA',
    sala_nome: 'Lab 1',
    usuario_nome: 'Ana',
    ...dados,
  };
}
