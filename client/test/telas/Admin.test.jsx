import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import Admin from '../../src/pages/Admin.jsx';
import AdminReservas from '../../src/pages/admin/AdminReservas.jsx';
import AdminSalas from '../../src/pages/admin/AdminSalas.jsx';
import AdminUsuarios from '../../src/pages/admin/AdminUsuarios.jsx';
import { api } from '../../src/api.js';
import { reserva, salas } from '../apiFalsa.js';
import { admin, renderizar } from '../renderizar.jsx';

vi.mock('../../src/api.js', async () => (await import('../apiFalsa.js')).criarApiFalsa());

const usuarios = [
  { id: 1, nome: 'Ana', email: 'ana@x.com', tipo: 'ALUNO' },
  { id: 3, nome: 'Carla', email: 'carla@x.com', tipo: 'ADMIN' },
];
const reservas = [
  reserva(),
  reserva({ id: 2, usuario_nome: 'Bia', sala_nome: 'Sala 2', sala_id: 2, data: '2026-01-12' }),
  reserva({ id: 3, status: 'CANCELADA', usuario_nome: 'Ana', data: '2026-01-13' }),
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-01-10T08:00:00'));
  api.listarSalas.mockResolvedValue(salas);
  api.todasReservas.mockResolvedValue(reservas);
  api.listarUsuarios.mockResolvedValue(usuarios);
  for (const metodo of ['criarSala', 'atualizarSala', 'excluirSala', 'alterarTipoUsuario', 'excluirUsuario']) {
    api[metodo].mockResolvedValue(null);
  }
});
afterEach(() => vi.useRealTimers());

const itemDe = (texto) => within(screen.getByText(texto).closest('li'));
const comoAdmin = (ui, acoes = {}) => renderizar(ui, { usuario: admin, ...acoes });

describe('Admin', () => {
  test('troca entre as seções de reservas, salas e usuários', async () => {
    comoAdmin(<Admin />);
    expect(await screen.findByRole('heading', { name: 'Todas as reservas' })).toBeInTheDocument();
    const secoes = within(screen.getByRole('navigation', { name: 'Administração' }));

    fireEvent.click(secoes.getByRole('button', { name: 'Salas' }));
    expect(await screen.findByRole('heading', { name: 'Salas cadastradas' })).toBeInTheDocument();
    expect(secoes.getByRole('button', { name: 'Salas' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(secoes.getByRole('button', { name: 'Usuários' }));
    expect(await screen.findByRole('heading', { name: 'Usuários' })).toBeInTheDocument();
  });
});

describe('AdminReservas', () => {
  test('mostra só as ativas por padrão, com o nome de quem reservou', async () => {
    comoAdmin(<AdminReservas />);
    expect(await screen.findByText('2 reservas encontradas')).toBeInTheDocument();
    expect(screen.getByText('Bia')).toBeInTheDocument();
  });

  test('filtra por situação, texto e data', async () => {
    comoAdmin(<AdminReservas />);
    await screen.findByText('2 reservas encontradas');

    fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'CANCELADA' } });
    expect(screen.getByText('1 reserva encontrada')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'TODAS' } });
    expect(screen.getByText('3 reservas encontradas')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Buscar por usuário ou sala'), { target: { value: '  SALA 2 ' } });
    expect(screen.getByText('1 reserva encontrada')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Buscar por usuário ou sala'), { target: { value: 'ana' } });
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2026-01-13' } });
    expect(screen.getByText('1 reserva encontrada')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Buscar por usuário ou sala'), { target: { value: 'ninguém' } });
    expect(screen.getByText('0 reservas encontradas')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma reserva com esses filtros.')).toBeInTheDocument();
  });

  test('editar e cancelar usam as ações do App', async () => {
    const { acoes } = comoAdmin(<AdminReservas />);
    await screen.findByText('Bia');
    fireEvent.click(itemDe('Bia').getByRole('button', { name: 'Editar' }));
    fireEvent.click(itemDe('Bia').getByRole('button', { name: 'Cancelar' }));
    expect(acoes.editarReserva).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
    expect(acoes.cancelarReserva).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
  });

  test('mostra o erro ao carregar', async () => {
    api.todasReservas.mockRejectedValue(new Error('Sem conexão.'));
    comoAdmin(<AdminReservas />);
    expect(await screen.findByText('Sem conexão.')).toBeInTheDocument();
  });
});

describe('AdminSalas', () => {
  function preencher(campos) {
    for (const [rotulo, valor] of Object.entries(campos)) {
      fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
    }
  }

  test('lista as salas e conta quantas são', async () => {
    comoAdmin(<AdminSalas />);
    expect(await screen.findByText('Laboratório · 30 lugares')).toBeInTheDocument();
    expect(screen.getByText('2 salas')).toBeInTheDocument();
    expect(screen.getByText('sem recursos')).toBeInTheDocument();
  });

  test('usa o singular com uma sala e avisa quando não há nenhuma', async () => {
    api.listarSalas.mockResolvedValue([salas[0]]);
    const { unmount } = comoAdmin(<AdminSalas />);
    expect(await screen.findByText('1 sala')).toBeInTheDocument();
    unmount();

    api.listarSalas.mockResolvedValue([]);
    comoAdmin(<AdminSalas />);
    expect(await screen.findByText('Nenhuma sala cadastrada.')).toBeInTheDocument();
  });

  test('cadastra uma sala no painel lateral, avisa e recarrega', async () => {
    const { acoes } = comoAdmin(<AdminSalas />);
    await screen.findByText('2 salas');
    fireEvent.click(screen.getByRole('button', { name: 'Nova sala' }));
    expect(screen.getByRole('dialog', { name: 'Nova sala' })).toBeInTheDocument();

    preencher({ Nome: 'Sala 3', Tipo: 'LABORATORIO', Capacidade: '12', Recursos: 'Projetor' });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar sala' }));
    expect(await screen.findByText('Sala cadastrada com sucesso!')).toBeInTheDocument();
    expect(api.criarSala).toHaveBeenCalledWith({ nome: 'Sala 3', tipo: 'LABORATORIO', capacidade: 12, recursos: 'Projetor' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(acoes.recarregar).toHaveBeenCalled();
  });

  test('edita uma sala no painel lateral', async () => {
    comoAdmin(<AdminSalas />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Lab 1' }));
    expect(screen.getByRole('dialog', { name: 'Editar sala' })).toBeInTheDocument();
    expect(screen.getByLabelText('Capacidade')).toHaveValue(30);

    preencher({ Capacidade: '35' });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Sala alterada com sucesso!')).toBeInTheDocument();
    expect(api.atualizarSala).toHaveBeenCalledWith(1, { nome: 'Lab 1', tipo: 'LABORATORIO', capacidade: 35, recursos: 'PCs' });
  });

  test('Voltar e o X fecham o painel sem salvar', async () => {
    comoAdmin(<AdminSalas />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Lab 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Nova sala' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.atualizarSala).not.toHaveBeenCalled();
  });

  test('exclui depois de confirmar, avisando que as reservas também serão excluídas', async () => {
    const { acoes } = comoAdmin(<AdminSalas />);
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir Lab 1' }));
    await waitFor(() => expect(api.excluirSala).toHaveBeenCalledWith(1));
    expect(acoes.confirmar).toHaveBeenCalledWith(expect.objectContaining({
      titulo: 'Excluir "Lab 1"?',
      mensagem: expect.stringMatching(/reservas desta sala também serão excluídas/),
    }));
    expect(await screen.findByText('Sala excluída.')).toBeInTheDocument();
    expect(acoes.recarregar).toHaveBeenCalled();
  });

  test('não exclui sem confirmação e mostra o erro quando falha', async () => {
    const confirmar = vi.fn().mockResolvedValue(false);
    comoAdmin(<AdminSalas />, { confirmar });
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir Lab 1' }));
    await waitFor(() => expect(confirmar).toHaveBeenCalled());
    expect(api.excluirSala).not.toHaveBeenCalled();

    confirmar.mockResolvedValue(true);
    api.excluirSala.mockRejectedValue(new Error('Falhou.'));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Lab 1' }));
    expect(await screen.findByText('Falhou.')).toBeInTheDocument();
  });

  test('mostra o erro ao carregar', async () => {
    api.listarSalas.mockRejectedValue(new Error('Sem conexão.'));
    comoAdmin(<AdminSalas />);
    expect(await screen.findByText('Sem conexão.')).toBeInTheDocument();
  });
});

describe('AdminUsuarios', () => {
  test('lista os usuários e não deixa o administrador alterar a si mesmo', async () => {
    comoAdmin(<AdminUsuarios />);
    expect(await screen.findByText('Carla (você)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir Carla' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Tipo de Ana' })).toHaveValue('ALUNO');
  });

  test('altera o tipo de outro usuário, avisa e recarrega', async () => {
    const { acoes } = comoAdmin(<AdminUsuarios />);
    fireEvent.change(await screen.findByRole('combobox', { name: 'Tipo de Ana' }), { target: { value: 'PROFESSOR' } });
    expect(await screen.findByText('Ana agora é Professor.')).toBeInTheDocument();
    expect(api.alterarTipoUsuario).toHaveBeenCalledWith(1, 'PROFESSOR');
    expect(acoes.recarregar).toHaveBeenCalled();
  });

  test('mostra o erro ao alterar o tipo', async () => {
    api.alterarTipoUsuario.mockRejectedValue(new Error('Não permitido.'));
    comoAdmin(<AdminUsuarios />);
    fireEvent.change(await screen.findByRole('combobox', { name: 'Tipo de Ana' }), { target: { value: 'ADMIN' } });
    expect(await screen.findByText('Não permitido.')).toBeInTheDocument();
  });

  test('mostra o erro quando não consegue listar', async () => {
    api.listarUsuarios.mockRejectedValue(new Error('Sem conexão.'));
    comoAdmin(<AdminUsuarios />);
    expect(await screen.findByText('Sem conexão.')).toBeInTheDocument();
  });

  test('exclui o usuário depois de confirmar', async () => {
    const { acoes } = comoAdmin(<AdminUsuarios />);
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir Ana' }));
    expect(await screen.findByText('Usuário excluído.')).toBeInTheDocument();
    expect(acoes.confirmar).toHaveBeenCalledWith(expect.objectContaining({ titulo: 'Excluir Ana?' }));
    expect(api.excluirUsuario).toHaveBeenCalledWith(1);
  });

  test('não exclui sem confirmação e mostra o erro quando falha', async () => {
    const confirmar = vi.fn().mockResolvedValue(false);
    comoAdmin(<AdminUsuarios />, { confirmar });
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir Ana' }));
    await waitFor(() => expect(confirmar).toHaveBeenCalled());
    expect(api.excluirUsuario).not.toHaveBeenCalled();

    confirmar.mockResolvedValue(true);
    api.excluirUsuario.mockRejectedValue(new Error('Falhou.'));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Ana' }));
    expect(await screen.findByText('Falhou.')).toBeInTheDocument();
  });
});
