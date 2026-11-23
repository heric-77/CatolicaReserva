import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import Agenda from '../../src/pages/Agenda.jsx';
import { api } from '../../src/api.js';
import { salas } from '../apiFalsa.js';
import { renderizar } from '../renderizar.jsx';

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
  beforeEach(() => {
    // 07h30: o horário das 07h já começou.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${HOJE}T07:30:00`));
    api.listarSalas.mockResolvedValue(salas);
    api.agendaDoDia.mockImplementation(async (data) => agendaDe(data));
  });
  afterEach(() => vi.useRealTimers());

  test('mostra a linha do tempo com horários passados, livres e blocos ocupados', async () => {
    const { container } = renderizar(<Agenda />);
    expect(await screen.findByText('Sábado, 10 de janeiro')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Horários de sábado, 10 de janeiro' })).toBeInTheDocument();
    expect(api.agendaDoDia).toHaveBeenCalledWith(HOJE);
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Sala', '7h', '8h', '9h']);
    expect(screen.getAllByText('Horário encerrado')).toHaveLength(2); // 07h das duas salas
    expect(screen.getByText('Ocupada das 09:00 às 10:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reservar Sala 2 das 09:00 às 10:00' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reservar Lab 1 das 09:00 às 10:00' })).not.toBeInTheDocument();

    // O bloco ocupado fica posicionado pelo horário (09h–10h dentro de 07h–10h).
    const bloco = container.querySelector('.bloco-ocupado');
    expect(bloco.style.left).toMatch(/^66\.66/);
    expect(bloco.style.width).toMatch(/^33\.33/);
    // Linha do "agora" (07h30) em cada sala.
    expect(container.querySelectorAll('.agora')).toHaveLength(2);
  });

  test('clicar num horário livre abre a reserva com o horário preenchido', async () => {
    const { acoes } = renderizar(<Agenda />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reservar Lab 1 das 08:00 às 09:00' }));
    expect(acoes.abrirReserva).toHaveBeenCalledWith({ salaId: 1, data: HOJE, horaInicio: '08:00', horaFim: '09:00' });
  });

  test('navega entre os dias e volta para hoje', async () => {
    const { container } = renderizar(<Agenda />);
    expect(screen.getByRole('button', { name: 'Dia anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Hoje' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }));
    expect(await screen.findByText('Domingo, 11 de janeiro')).toBeInTheDocument();
    expect(api.agendaDoDia).toHaveBeenLastCalledWith('2026-01-11');
    expect(screen.queryByText('Horário encerrado')).not.toBeInTheDocument();
    expect(container.querySelector('.agora')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dia anterior' }));
    expect(await screen.findByText('Domingo, 11 de janeiro')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));
    expect(await screen.findByText('Sábado, 10 de janeiro')).toBeInTheDocument();
  });

  test('fora do expediente não mostra a linha do agora', async () => {
    vi.setSystemTime(new Date(`${HOJE}T06:00:00`));
    const { container } = renderizar(<Agenda />);
    await screen.findByRole('table');
    expect(container.querySelector('.agora')).toBeNull();
  });

  test('sem data pede para escolher uma e não consulta a API', async () => {
    renderizar(<Agenda />);
    await screen.findByRole('table');
    api.agendaDoDia.mockClear();
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '' } });
    expect(screen.getByText('Escolha uma data para ver a agenda.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próximo dia' })).toBeDisabled();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(api.agendaDoDia).not.toHaveBeenCalled();
  });

  test('avisa quando não há salas', async () => {
    api.listarSalas.mockResolvedValue([]);
    renderizar(<Agenda />);
    expect(await screen.findByText('Nenhuma sala cadastrada.')).toBeInTheDocument();
  });

  test('mostra o erro ao carregar as salas ou a agenda', async () => {
    api.listarSalas.mockRejectedValue(new Error('Falha nas salas.'));
    api.agendaDoDia.mockRejectedValue(new Error('Falha na agenda.'));
    renderizar(<Agenda />);
    expect(await screen.findByText(/Falha (na agenda|nas salas)\./)).toBeInTheDocument();
  });

  test('ignora a resposta atrasada de uma data que o usuário já trocou', async () => {
    let responderHoje;
    api.agendaDoDia.mockImplementation((data) => (
      data === HOJE
        ? new Promise((resolve) => { responderHoje = () => resolve(agendaDe(HOJE)); })
        : Promise.resolve(agendaDe(data))
    ));
    renderizar(<Agenda />);
    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }));
    expect(await screen.findByText('Domingo, 11 de janeiro')).toBeInTheDocument();

    await act(async () => responderHoje());
    expect(screen.getByText('Domingo, 11 de janeiro')).toBeInTheDocument();
  });

  test('ignora o erro atrasado de uma data que o usuário já trocou', async () => {
    let falharHoje;
    api.agendaDoDia.mockImplementation((data) => (
      data === HOJE
        ? new Promise((_, reject) => { falharHoje = () => reject(new Error('Erro antigo.')); })
        : Promise.resolve(agendaDe(data))
    ));
    renderizar(<Agenda />);
    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }));
    await screen.findByRole('table');

    await act(async () => falharHoje());
    expect(screen.queryByText('Erro antigo.')).not.toBeInTheDocument();
  });

  test('recarrega a agenda quando uma reserva é gravada (nova versão)', async () => {
    const { novaVersao } = renderizar(<Agenda />);
    await screen.findByRole('table');
    novaVersao(1);
    await screen.findByRole('table');
    expect(api.agendaDoDia).toHaveBeenCalledTimes(2);
  });
});
