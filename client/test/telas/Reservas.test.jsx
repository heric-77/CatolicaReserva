import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Reservas from '../../src/pages/Reservas.jsx';
import { api } from '../../src/api.js';
import { reserva, salas } from '../apiFalsa.js';

vi.mock('../../src/api.js', async () => (await import('../apiFalsa.js')).criarApiFalsa());

function formularioDe(rotuloDoBotao) {
  return within(screen.getByRole('button', { name: rotuloDoBotao }).closest('form'));
}

function preencher(form, { data = '2026-01-11', inicio = '10:00', fim = '11:00' } = {}) {
  fireEvent.change(form.getByLabelText('Data'), { target: { value: data } });
  fireEvent.change(form.getByLabelText('Início'), { target: { value: inicio } });
  fireEvent.change(form.getByLabelText('Fim'), { target: { value: fim } });
}

describe('Reservas', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-10T08:00:00'));
    api.listarSalas.mockResolvedValue(salas);
    api.minhasReservas.mockResolvedValue([
      reserva(),
      reserva({ id: 2, status: 'CANCELADA', sala_nome: 'Sala 2', data: '2026-01-12' }),
    ]);
    api.criarReserva.mockResolvedValue({});
    api.editarReserva.mockResolvedValue({});
    api.cancelarReserva.mockResolvedValue({});
  });
  afterEach(() => vi.useRealTimers());

  test('lista as salas e as reservas do usuário', async () => {
    render(<Reservas />);
    expect(await screen.findByText('11/01/2026 · 10:00–11:00', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('30 lugares · PCs')).toBeInTheDocument();
    expect(screen.getByText('4 lugares · sem recursos')).toBeInTheDocument();
    // Só a reserva ativa tem os botões de editar e cancelar.
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(1);
  });

  test('mostra os avisos de lista vazia', async () => {
    api.listarSalas.mockResolvedValue([]);
    api.minhasReservas.mockResolvedValue([]);
    render(<Reservas />);
    expect(await screen.findByText('Nenhuma sala cadastrada.')).toBeInTheDocument();
    expect(screen.getByText('Você ainda não tem reservas.')).toBeInTheDocument();
  });

  test('mostra o erro quando não consegue carregar', async () => {
    api.listarSalas.mockRejectedValue(new Error('Servidor fora do ar.'));
    render(<Reservas />);
    expect(await screen.findByText('Servidor fora do ar.')).toBeInTheDocument();
  });

  test('cria uma reserva, avisa e recarrega a lista', async () => {
    render(<Reservas />);
    await screen.findByText('30 lugares · PCs');
    preencher(formularioDe('Reservar'));
    fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));
    expect(await screen.findByText('Reserva realizada com sucesso!')).toBeInTheDocument();
    expect(api.criarReserva).toHaveBeenCalledWith({ salaId: 1, data: '2026-01-11', horaInicio: '10:00', horaFim: '11:00' });
    expect(api.minhasReservas).toHaveBeenCalledTimes(2);
  });

  test('chega com o horário escolhido na agenda já preenchido', async () => {
    render(<Reservas horarioEscolhido={{ salaId: 2, data: '2026-01-12', horaInicio: '15:00', horaFim: '16:00' }} />);
    const form = formularioDe('Reservar');
    await waitFor(() => expect(form.getByLabelText('Sala')).toHaveValue('2'));
    expect(form.getByLabelText('Data')).toHaveValue('2026-01-12');
  });

  test('edita uma reserva com os dados atuais preenchidos', async () => {
    render(<Reservas />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    const form = formularioDe('Salvar alterações');
    expect(form.getByLabelText('Início')).toHaveValue('10:00');
    fireEvent.change(form.getByLabelText('Fim'), { target: { value: '12:00' } });
    fireEvent.click(form.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Reserva alterada com sucesso!')).toBeInTheDocument();
    expect(api.editarReserva).toHaveBeenCalledWith(1, { salaId: 1, data: '2026-01-11', horaInicio: '10:00', horaFim: '12:00' });
    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument();
  });

  test('Voltar fecha a edição sem salvar', async () => {
    render(<Reservas />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument();
    expect(api.editarReserva).not.toHaveBeenCalled();
  });

  test('cancela a reserva depois da confirmação', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Reservas />);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByText('Reserva cancelada.')).toBeInTheDocument();
    expect(api.cancelarReserva).toHaveBeenCalledWith(1);
  });

  test('não cancela se o usuário desistir na confirmação', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Reservas />);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    expect(api.cancelarReserva).not.toHaveBeenCalled();
  });

  test('mostra o erro quando o cancelamento falha', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.cancelarReserva.mockRejectedValue(new Error('Você não tem permissão.'));
    render(<Reservas />);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByText('Você não tem permissão.')).toBeInTheDocument();
  });
});
