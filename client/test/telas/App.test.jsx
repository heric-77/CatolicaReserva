// Testes de integração do App: telas, painel de reserva, confirmação e avisos
// funcionando juntos, com a API simulada.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '../../src/App.jsx';
import { api, EVENTO_SESSAO_EXPIRADA } from '../../src/api.js';
import { reserva, salas } from '../apiFalsa.js';

vi.mock('../../src/api.js', async () => (await import('../apiFalsa.js')).criarApiFalsa());

const HOJE = '2026-01-10';
const aluno = { id: 7, nome: 'Ana Souza', tipo: 'ALUNO' };
const admin = { id: 3, nome: 'Carla', tipo: 'ADMIN' };

function entrarComo(usuario) {
  localStorage.setItem('token', 'token-salvo');
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

const navegacao = () => within(screen.getByRole('navigation', { name: 'Principal' }));
const irPara = (tela) => fireEvent.click(navegacao().getByRole('button', { name: tela }));

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${HOJE}T07:30:00`));
    api.listarSalas.mockResolvedValue(salas);
    api.minhasReservas.mockResolvedValue([reserva()]);
    api.todasReservas.mockResolvedValue([]);
    api.agendaDoDia.mockImplementation(async (data) => ({ data, abertura: '07:00', fechamento: '10:00', ocupadas: [] }));
    api.criarReserva.mockResolvedValue({});
    api.editarReserva.mockResolvedValue({});
    api.cancelarReserva.mockResolvedValue({});
  });
  afterEach(() => vi.useRealTimers());

  test('sem usuário salvo mostra o login e nenhuma navegação', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  test('ao entrar guarda a sessão e abre o Início', async () => {
    api.login.mockResolvedValue({ token: 'novo-token', usuario: aluno });
    render(<App />);
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@x.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Bom dia, Ana' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('novo-token');
    expect(JSON.parse(localStorage.getItem('usuario'))).toEqual(aluno);
    // Cartão do usuário na barra lateral: nome, tipo e iniciais.
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Aluno')).toBeInTheDocument();
    expect(screen.getByText('AS', { selector: '.avatar' })).toBeInTheDocument();
  });

  test('navega pelas telas pela barra lateral', async () => {
    entrarComo(aluno);
    render(<App />);
    expect(navegacao().getByRole('button', { name: 'Início' })).toHaveAttribute('aria-current', 'page');

    irPara('Salas');
    expect(await screen.findByRole('heading', { level: 1, name: 'Salas' })).toBeInTheDocument();
    irPara('Agenda');
    expect(await screen.findByRole('heading', { level: 1, name: 'Agenda' })).toBeInTheDocument();
    irPara('Minhas reservas');
    expect(await screen.findByRole('heading', { level: 1, name: 'Minhas reservas' })).toBeInTheDocument();
    expect(navegacao().getByRole('button', { name: 'Minhas reservas' })).toHaveAttribute('aria-current', 'page');
    expect(navegacao().queryByRole('button', { name: 'Administração' })).not.toBeInTheDocument();
  });

  test('o administrador também vê a Administração', async () => {
    entrarComo(admin);
    render(<App />);
    irPara('Administração');
    expect(await screen.findByRole('heading', { name: 'Todas as reservas' })).toBeInTheDocument();
  });

  test('cria uma reserva pelo painel lateral, avisa e atualiza as telas', async () => {
    entrarComo(aluno);
    render(<App />);
    await screen.findByText('Próximas reservas');
    const carregamentos = api.minhasReservas.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Nova reserva' }));
    const painel = within(screen.getByRole('dialog', { name: 'Nova reserva' }));
    await waitFor(() => expect(painel.getByLabelText('Sala')).toHaveValue('1'));
    fireEvent.change(painel.getByLabelText('Data'), { target: { value: '2026-01-11' } });
    fireEvent.change(painel.getByLabelText('Início'), { target: { value: '08:00' } });
    fireEvent.click(painel.getByRole('button', { name: '1 h' }));
    fireEvent.click(painel.getByRole('button', { name: 'Reservar' }));

    expect(await screen.findByText('Reserva realizada com sucesso!')).toBeInTheDocument();
    expect(api.criarReserva).toHaveBeenCalledWith({ salaId: 1, data: '2026-01-11', horaInicio: '08:00', horaFim: '09:00' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(api.minhasReservas.mock.calls.length).toBeGreaterThan(carregamentos));
  });

  test('escolher um horário livre na agenda abre o painel já preenchido', async () => {
    entrarComo(aluno);
    render(<App />);
    irPara('Agenda');
    fireEvent.click(await screen.findByRole('button', { name: 'Reservar Sala 2 das 08:00 às 09:00' }));
    const painel = within(screen.getByRole('dialog', { name: 'Nova reserva' }));
    await waitFor(() => expect(painel.getByLabelText('Sala')).toHaveValue('2'));
    expect(painel.getByLabelText('Início')).toHaveValue('08:00');
    expect(painel.getByLabelText('Fim')).toHaveValue('09:00');
  });

  test('edita uma reserva pelo painel lateral', async () => {
    entrarComo(aluno);
    render(<App />);
    irPara('Minhas reservas');
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    const painel = within(screen.getByRole('dialog', { name: 'Editar reserva' }));
    expect(painel.getByLabelText('Início')).toHaveValue('10:00');
    // O botão só habilita depois que as salas carregam.
    await waitFor(() => expect(painel.getByRole('button', { name: 'Salvar alterações' })).toBeEnabled());
    fireEvent.click(painel.getByRole('button', { name: '2 h' }));
    fireEvent.click(painel.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Reserva alterada com sucesso!')).toBeInTheDocument();
    expect(api.editarReserva).toHaveBeenCalledWith(1, { salaId: 1, data: '2026-01-11', horaInicio: '10:00', horaFim: '12:00' });
  });

  test('fechar o painel não salva nada', async () => {
    entrarComo(aluno);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Nova reserva' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.criarReserva).not.toHaveBeenCalled();
  });

  test('cancelar pede confirmação; Voltar mantém a reserva', async () => {
    entrarComo(aluno);
    render(<App />);
    irPara('Minhas reservas');
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));

    const dialogo = screen.getByRole('alertdialog', { name: 'Cancelar reserva?' });
    expect(dialogo).toHaveAccessibleDescription('Lab 1, 11/01/2026, das 10:00 às 11:00. O horário fica livre para outras pessoas.');
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Voltar' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(api.cancelarReserva).not.toHaveBeenCalled();
  });

  test('confirmar o cancelamento cancela e avisa; erro do servidor vira aviso de erro', async () => {
    entrarComo(aluno);
    render(<App />);
    irPara('Minhas reservas');
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
    expect(await screen.findByText('Reserva cancelada.')).toBeInTheDocument();
    expect(api.cancelarReserva).toHaveBeenCalledWith(1);

    api.cancelarReserva.mockRejectedValue(new Error('Você não tem permissão.'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
    expect(await screen.findByText('Você não tem permissão.')).toBeInTheDocument();
  });

  test('Sair limpa a sessão e volta para o login', async () => {
    entrarComo(aluno);
    render(<App />);
    await screen.findByText('Próximas reservas');
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
  });

  test('quando a sessão expira volta para o login com aviso', async () => {
    entrarComo(aluno);
    render(<App />);
    await screen.findByText('Próximas reservas');
    act(() => window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA)));
    expect(screen.getByRole('status')).toHaveTextContent('Sua sessão expirou. Entre novamente.');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
