import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import MinhasReservas from '../../src/pages/MinhasReservas.jsx';
import { api } from '../../src/api.js';
import { reserva } from '../apiFalsa.js';
import { renderizar } from '../renderizar.jsx';

vi.mock('../../src/api.js', async () => (await import('../apiFalsa.js')).criarApiFalsa());

describe('Minhas reservas', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-10T08:00:00'));
    api.minhasReservas.mockResolvedValue([
      reserva({ id: 1, data: '2026-01-10', hora_inicio: '14:00:00', hora_fim: '15:00:00', sala_nome: 'Sala 2' }),
      reserva({ id: 2, data: '2026-01-11' }),
      reserva({ id: 3, data: '2026-01-11', hora_inicio: '16:00:00', hora_fim: '17:00:00', sala_nome: 'Lab 2' }),
      reserva({ id: 4, data: '2026-01-09' }),
      reserva({ id: 5, data: '2026-01-20', status: 'CANCELADA' }),
    ]);
  });
  afterEach(() => vi.useRealTimers());

  test('mostra as próximas agrupadas por dia, com Hoje e Amanhã', async () => {
    renderizar(<MinhasReservas />);
    const hoje = await screen.findByRole('region', { name: 'Hoje' });
    expect(within(hoje).getByText('Sala 2')).toBeInTheDocument();
    const amanha = screen.getByRole('region', { name: 'Amanhã' });
    expect(within(amanha).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Próximas/ })).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: /Histórico/ })).toHaveTextContent('2');
  });

  test('o histórico mostra as passadas e as canceladas, sem ações', async () => {
    renderizar(<MinhasReservas />);
    await screen.findByRole('region', { name: 'Hoje' });
    fireEvent.click(screen.getByRole('button', { name: /Histórico/ }));
    expect(screen.getByRole('button', { name: /Histórico/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('region', { name: 'Ontem' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Terça-feira, 20 de janeiro' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
    // A reserva de ontem continua ATIVA no banco, mas já terminou.
    expect(within(screen.getByRole('region', { name: 'Ontem' })).getByText('Concluída')).toBeInTheDocument();
    expect(screen.getByText('Cancelada')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Próximas/ }));
    expect(screen.getByRole('region', { name: 'Hoje' })).toBeInTheDocument();
  });

  test('editar, cancelar e nova reserva chamam as ações do App', async () => {
    const { acoes } = renderizar(<MinhasReservas />);
    const hoje = await screen.findByRole('region', { name: 'Hoje' });
    fireEvent.click(within(hoje).getByRole('button', { name: 'Editar' }));
    fireEvent.click(within(hoje).getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nova reserva' }));
    expect(acoes.editarReserva).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(acoes.cancelarReserva).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(acoes.abrirReserva).toHaveBeenCalled();
  });

  test('listas vazias têm mensagens próprias', async () => {
    api.minhasReservas.mockResolvedValue([]);
    renderizar(<MinhasReservas />);
    expect(await screen.findByText('Você ainda não tem reservas futuras.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Nova reserva' })).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /Histórico/ }));
    expect(screen.getByText('Nenhuma reserva passada ou cancelada.')).toBeInTheDocument();
  });

  test('mostra o erro quando não consegue carregar', async () => {
    api.minhasReservas.mockRejectedValue(new Error('Servidor fora do ar.'));
    renderizar(<MinhasReservas />);
    expect(await screen.findByText('Servidor fora do ar.')).toBeInTheDocument();
  });
});
