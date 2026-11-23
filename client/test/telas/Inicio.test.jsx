import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import Inicio from '../../src/pages/Inicio.jsx';
import { api } from '../../src/api.js';
import { reserva, salas } from '../apiFalsa.js';
import { renderizar } from '../renderizar.jsx';

vi.mock('../../src/api.js', async () => (await import('../apiFalsa.js')).criarApiFalsa());

const HOJE = '2026-01-10';

describe('Início', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${HOJE}T09:30:00`));
    api.minhasReservas.mockResolvedValue([
      reserva({ id: 1, data: '2026-01-11', hora_inicio: '14:00:00', hora_fim: '16:00:00', sala_nome: 'Sala 2' }),
      reserva({ id: 2, data: '2026-01-15', hora_inicio: '08:00:00', hora_fim: '09:30:00' }),
      reserva({ id: 3, data: '2026-01-09', status: 'CANCELADA' }),
    ]);
    api.listarSalas.mockResolvedValue(salas);
    api.agendaDoDia.mockResolvedValue({
      data: HOJE,
      abertura: '07:00',
      fechamento: '22:00',
      ocupadas: [{ sala_id: 2, hora_inicio: '09:00:00', hora_fim: '10:00:00' }, { sala_id: 1, hora_inicio: '12:00:00', hora_fim: '13:00:00' }],
    });
  });
  afterEach(() => vi.useRealTimers());

  test('cumprimenta pelo primeiro nome e mostra a data de hoje', async () => {
    renderizar(<Inicio />);
    expect(screen.getByRole('heading', { level: 1, name: 'Bom dia, Ana' })).toBeInTheDocument();
    expect(screen.getByText('Sábado, 10 de janeiro')).toBeInTheDocument();
    expect(api.agendaDoDia).toHaveBeenCalledWith(HOJE);
  });

  test('mostra os números: próximas reservas, horas no mês e salas livres agora', async () => {
    renderizar(<Inicio />);
    expect(await screen.findByText('1 de 2')).toBeInTheDocument();
    expect(screen.getByText('Próximas reservas').previousSibling).toHaveTextContent('2');
    expect(screen.getByText('Horas reservadas em janeiro').previousSibling).toHaveTextContent('3,5 h');
  });

  test('destaca a próxima reserva e lista as seguintes', async () => {
    const { acoes } = renderizar(<Inicio />);
    expect(await screen.findByText('14:00 – 16:00')).toBeInTheDocument();
    expect(screen.getByText('Amanhã')).toBeInTheDocument();
    expect(screen.getByText('Sala 2 · 2 h')).toBeInTheDocument();

    const destaque = within(screen.getByText('14:00 – 16:00').closest('.destaque-reserva'));
    fireEvent.click(destaque.getByRole('button', { name: 'Editar' }));
    fireEvent.click(destaque.getByRole('button', { name: 'Cancelar' }));
    expect(acoes.editarReserva).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(acoes.cancelarReserva).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));

    expect(screen.getByRole('heading', { name: 'Depois' })).toBeInTheDocument();
    expect(screen.getByText('15/01/2026 · 08:00–09:30 · 1 h 30 min')).toBeInTheDocument();
  });

  test('lista as salas livres agora e reserva com o próximo horário já preenchido', async () => {
    const { acoes } = renderizar(<Inicio />);
    expect(await screen.findByText('Próximo horário para reservar: 10:00 às 11:00.')).toBeInTheDocument();
    expect(screen.getByText('Livre até 12:00 · até 30 pessoas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reservar Sala 2' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reservar Lab 1' }));
    expect(acoes.abrirReserva).toHaveBeenCalledWith({ salaId: 1, data: HOJE, horaInicio: '10:00', horaFim: '11:00' });
  });

  test('botão de reservar do cabeçalho e link para todas as reservas', async () => {
    const { acoes } = renderizar(<Inicio />);
    await screen.findByText('14:00 – 16:00');
    fireEvent.click(screen.getByRole('button', { name: 'Reservar uma sala' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver todas' }));
    expect(acoes.abrirReserva).toHaveBeenCalledWith();
    expect(acoes.navegar).toHaveBeenCalledWith('reservas');
  });

  test('sem reservas futuras e fora do expediente', async () => {
    vi.setSystemTime(new Date(`${HOJE}T22:30:00`));
    api.minhasReservas.mockResolvedValue([]);
    renderizar(<Inicio />);
    expect(await screen.findByText('Você não tem reservas futuras.')).toBeInTheDocument();
    expect(screen.getByText('Boa noite, Ana', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Fora do horário de funcionamento.')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma sala livre agora.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Reservar uma sala' })).toHaveLength(2);
  });

  test('mostra o erro quando não consegue carregar', async () => {
    api.minhasReservas.mockRejectedValue(new Error('Servidor fora do ar.'));
    renderizar(<Inicio />);
    expect(await screen.findByText('Servidor fora do ar.')).toBeInTheDocument();
    expect(screen.getByText('–')).toBeInTheDocument();
  });
});
