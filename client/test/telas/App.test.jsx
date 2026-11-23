import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import App from '../../src/App.jsx';
import { api, EVENTO_SESSAO_EXPIRADA } from '../../src/api.js';
import { salas } from '../apiFalsa.js';

vi.mock('../../src/api.js', async () => (await import('../apiFalsa.js')).criarApiFalsa());

const aluno = { id: 1, nome: 'Ana', tipo: 'ALUNO' };
const admin = { id: 3, nome: 'Carla', tipo: 'ADMIN' };

function entrarComo(usuario) {
  localStorage.setItem('token', 'token-salvo');
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

const navegacao = () => within(screen.getByRole('navigation', { name: 'Principal' }));

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-10T07:30:00'));
    api.listarSalas.mockResolvedValue(salas);
    api.minhasReservas.mockResolvedValue([]);
    api.todasReservas.mockResolvedValue([]);
    api.agendaDoDia.mockImplementation(async (data) => ({ data, abertura: '07:00', fechamento: '10:00', ocupadas: [] }));
  });
  afterEach(() => vi.useRealTimers());

  test('sem usuário salvo mostra o login e nenhuma navegação', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  test('ao entrar guarda a sessão e abre a tela de reservas', async () => {
    api.login.mockResolvedValue({ token: 'novo-token', usuario: aluno });
    render(<App />);
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@x.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Minhas reservas' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('novo-token');
    expect(JSON.parse(localStorage.getItem('usuario'))).toEqual(aluno);
    expect(screen.getByText('Ana · ALUNO')).toBeInTheDocument();
  });

  test('aluno não vê a área de administração; administrador vê', async () => {
    entrarComo(aluno);
    const { unmount } = render(<App />);
    expect(navegacao().queryByRole('button', { name: 'Administração' })).not.toBeInTheDocument();
    await screen.findByText('Você ainda não tem reservas.');
    unmount();

    entrarComo(admin);
    render(<App />);
    fireEvent.click(navegacao().getByRole('button', { name: 'Administração' }));
    expect(await screen.findByRole('heading', { name: 'Todas as reservas' })).toBeInTheDocument();
  });

  test('escolher um horário na agenda abre a reserva já preenchida', async () => {
    entrarComo(aluno);
    render(<App />);
    fireEvent.click(navegacao().getByRole('button', { name: 'Agenda' }));
    expect(navegacao().getByRole('button', { name: 'Agenda' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(await screen.findByRole('button', { name: 'Reservar Sala 2 das 08:00 às 09:00' }));
    expect(await screen.findByRole('heading', { name: 'Nova reserva' })).toBeInTheDocument();
    expect(screen.getByLabelText('Início')).toHaveValue('08:00');
    expect(screen.getByLabelText('Sala')).toHaveValue('2');
  });

  test('Sair limpa a sessão e volta para o login', async () => {
    entrarComo(aluno);
    render(<App />);
    await screen.findByText('Você ainda não tem reservas.');
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
  });

  test('quando a sessão expira volta para o login com aviso', async () => {
    entrarComo(aluno);
    render(<App />);
    await screen.findByText('Você ainda não tem reservas.');
    act(() => window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA)));
    expect(screen.getByRole('status')).toHaveTextContent('Sua sessão expirou. Entre novamente.');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
