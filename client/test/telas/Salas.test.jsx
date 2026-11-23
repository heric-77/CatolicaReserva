import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import Salas from '../../src/pages/Salas.jsx';
import { api } from '../../src/api.js';
import { renderizar } from '../renderizar.jsx';

vi.mock('../../src/api.js', async () => (await import('../apiFalsa.js')).criarApiFalsa());

const HOJE = '2026-01-10';
const salas = [
  { id: 1, nome: 'Laboratório de Informática', tipo: 'LABORATORIO', capacidade: 30, recursos: '30 computadores, projetor' },
  { id: 2, nome: 'Sala de Estudos A', tipo: 'SALA_ESTUDO', capacidade: 6, recursos: '' },
  { id: 3, nome: 'Sala de Estudos B', tipo: 'SALA_ESTUDO', capacidade: 4, recursos: 'TV' },
];

describe('Salas', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${HOJE}T09:30:00`));
    api.listarSalas.mockResolvedValue(salas);
    api.agendaDoDia.mockResolvedValue({
      data: HOJE,
      abertura: '07:00',
      fechamento: '22:00',
      ocupadas: [{ sala_id: 2, hora_inicio: '09:00:00', hora_fim: '11:00:00' }],
    });
  });
  afterEach(() => vi.useRealTimers());

  test('mostra cada sala com capacidade, recursos e situação agora', async () => {
    renderizar(<Salas />);
    expect(await screen.findByRole('heading', { name: 'Laboratório de Informática' })).toBeInTheDocument();
    expect(screen.getByText('3 salas')).toBeInTheDocument();
    expect(screen.getByText('Até 30 pessoas · Laboratório')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Recursos de Laboratório de Informática' })).toHaveTextContent('30 computadoresprojetor');
    expect(screen.getByText('Sem recursos extras')).toBeInTheDocument();
    expect(screen.getByText('Ocupada até 11:00')).toBeInTheDocument();
    expect(screen.getAllByText('Livre até 22:00')).toHaveLength(2);
  });

  test('filtra por tipo e pela busca (nome ou recurso)', async () => {
    renderizar(<Salas />);
    await screen.findByText('3 salas');

    fireEvent.click(screen.getByRole('button', { name: 'Salas de estudo' }));
    expect(screen.getByRole('button', { name: 'Salas de estudo' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('2 salas')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Buscar sala'), { target: { value: ' tv ' } });
    expect(screen.getByText('1 sala')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sala de Estudos B' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Buscar sala'), { target: { value: 'nada' } });
    expect(screen.getByText('Nenhuma sala encontrada.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Todas' }));
    fireEvent.change(screen.getByLabelText('Buscar sala'), { target: { value: 'laboratório' } });
    expect(screen.getByText('1 sala')).toBeInTheDocument();
  });

  test('reservar abre o painel com a sala, hoje e o próximo horário', async () => {
    const { acoes } = renderizar(<Salas />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reservar Sala de Estudos B' }));
    expect(acoes.abrirReserva).toHaveBeenCalledWith({ salaId: 3, data: HOJE, horaInicio: '10:00', horaFim: '11:00' });
  });

  test('fora do expediente reserva só com a sala e a data', async () => {
    vi.setSystemTime(new Date(`${HOJE}T22:30:00`));
    const { acoes } = renderizar(<Salas />);
    expect(await screen.findAllByText('Fechada agora')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Reservar Sala de Estudos A' }));
    expect(acoes.abrirReserva).toHaveBeenCalledWith({ salaId: 2, data: HOJE });
  });

  test('recarrega quando a versão muda e mostra erro de carregamento', async () => {
    const { novaVersao } = renderizar(<Salas />);
    await screen.findByText('3 salas');
    api.listarSalas.mockRejectedValue(new Error('Sem conexão.'));
    novaVersao(1);
    expect(await screen.findByText('Sem conexão.')).toBeInTheDocument();
    expect(api.listarSalas).toHaveBeenCalledTimes(2);
  });
});
