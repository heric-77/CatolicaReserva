import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Agenda from '../../src/pages/Agenda.jsx';
import { api } from '../../src/api.js';
import { salas } from '../apiFalsa.js';

vi.mock('../../src/api.js', async () => (await import('../apiFalsa.js')).criarApiFalsa());

const HOJE = '2026-01-10';

// Agenda das 07h às 10h, com a Lab 1 ocupada das 09h às 10h.
function agendaDe(data) {
  return {
    data,
    abertura: '07:00',
    fechamento: '10:00',
    ocupadas: [{ sala_id: 1, hora_inicio: '09:00:00', hora_fim: '10:00:00' }],
  };
}

describe('Agenda', () => {
  let aoEscolherHorario;

  beforeEach(() => {
    // 07h30: o horário das 07h já começou.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${HOJE}T07:30:00`));
    aoEscolherHorario = vi.fn();
    api.listarSalas.mockResolvedValue(salas);
    api.agendaDoDia.mockImplementation(async (data) => agendaDe(data));
  });
  afterEach(() => vi.useRealTimers());

  test('mostra a tabela do dia com horários passados, livres e ocupados', async () => {
    render(<Agenda aoEscolherHorario={aoEscolherHorario} />);
    expect(await screen.findByText('Horários de sábado, 10 de janeiro')).toBeInTheDocument();
    expect(api.agendaDoDia).toHaveBeenCalledWith(HOJE);
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Sala', '7h', '8h', '9h']);
    expect(screen.getAllByText('Horário encerrado')).toHaveLength(2); // 07h das duas salas
    expect(screen.getByText('Ocupada das 09:00 às 10:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reservar Sala 2 das 09:00 às 10:00' })).toBeInTheDocument();
  });

  test('clicar num horário livre leva o horário para a reserva', async () => {
    render(<Agenda aoEscolherHorario={aoEscolherHorario} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reservar Lab 1 das 08:00 às 09:00' }));
    expect(aoEscolherHorario).toHaveBeenCalledWith({ salaId: 1, data: HOJE, horaInicio: '08:00', horaFim: '09:00' });
  });

  test('navega para o próximo dia e volta, mas não antes de hoje', async () => {
    render(<Agenda aoEscolherHorario={aoEscolherHorario} />);
    const anterior = screen.getByRole('button', { name: 'Dia anterior' });
    expect(anterior).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }));
    expect(await screen.findByText('Horários de domingo, 11 de janeiro')).toBeInTheDocument();
    expect(api.agendaDoDia).toHaveBeenLastCalledWith('2026-01-11');
    // No dia seguinte nenhum horário passou.
    expect(screen.queryByText('Horário encerrado')).not.toBeInTheDocument();

    fireEvent.click(anterior);
    expect(await screen.findByText('Horários de sábado, 10 de janeiro')).toBeInTheDocument();
  });

  test('sem data pede para escolher uma e não consulta a API', async () => {
    render(<Agenda aoEscolherHorario={aoEscolherHorario} />);
    await screen.findByRole('table');
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '' } });
    expect(screen.getByText('Escolha uma data para ver a agenda.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próximo dia' })).toBeDisabled();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('avisa quando não há salas', async () => {
    api.listarSalas.mockResolvedValue([]);
    render(<Agenda aoEscolherHorario={aoEscolherHorario} />);
    expect(await screen.findByText('Nenhuma sala cadastrada.')).toBeInTheDocument();
  });

  test('mostra o erro ao carregar as salas ou a agenda', async () => {
    api.listarSalas.mockRejectedValue(new Error('Falha nas salas.'));
    api.agendaDoDia.mockRejectedValue(new Error('Falha na agenda.'));
    render(<Agenda aoEscolherHorario={aoEscolherHorario} />);
    expect(await screen.findByText(/Falha na (agenda|salas)\./)).toBeInTheDocument();
  });

  test('ignora a resposta atrasada de uma data que o usuário já trocou', async () => {
    let responderHoje;
    api.agendaDoDia.mockImplementation((data) => (
      data === HOJE
        ? new Promise((resolve) => { responderHoje = () => resolve(agendaDe(HOJE)); })
        : Promise.resolve(agendaDe(data))
    ));
    render(<Agenda aoEscolherHorario={aoEscolherHorario} />);
    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }));
    expect(await screen.findByText('Horários de domingo, 11 de janeiro')).toBeInTheDocument();

    await act(async () => responderHoje());
    expect(screen.getByText('Horários de domingo, 11 de janeiro')).toBeInTheDocument();
  });

  test('ignora o erro atrasado de uma data que o usuário já trocou', async () => {
    let falharHoje;
    api.agendaDoDia.mockImplementation((data) => (
      data === HOJE
        ? new Promise((_, reject) => { falharHoje = () => reject(new Error('Erro antigo.')); })
        : Promise.resolve(agendaDe(data))
    ));
    render(<Agenda aoEscolherHorario={aoEscolherHorario} />);
    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }));
    await screen.findByRole('table');

    await act(async () => falharHoje());
    expect(screen.queryByText('Erro antigo.')).not.toBeInTheDocument();
  });
});
