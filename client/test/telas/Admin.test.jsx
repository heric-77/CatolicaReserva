import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Admin from '../../src/pages/Admin.jsx';
import AdminReservas from '../../src/pages/admin/AdminReservas.jsx';
import AdminSalas from '../../src/pages/admin/AdminSalas.jsx';
import AdminUsuarios from '../../src/pages/admin/AdminUsuarios.jsx';
import { api } from '../../src/api.js';
import { reserva, salas } from '../apiFalsa.js';

vi.mock('../../src/api.js', async () => (await import('../apiFalsa.js')).criarApiFalsa());

const eu = { id: 3, nome: 'Carla', tipo: 'ADMIN' };
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
  for (const metodo of ['editarReserva', 'cancelarReserva', 'criarSala', 'atualizarSala', 'excluirSala', 'alterarTipoUsuario', 'excluirUsuario']) {
    api[metodo].mockResolvedValue(null);
  }
});
afterEach(() => vi.useRealTimers());

const itemDe = (texto) => within(screen.getByText(texto).closest('li'));

describe('Admin', () => {
  test('troca entre as seções de reservas, salas e usuários', async () => {
    render(<Admin usuario={eu} />);
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
  test('mostra só as ativas por padrão e conta o resultado', async () => {
    render(<AdminReservas />);
    expect(await screen.findByText('2 reservas encontradas')).toBeInTheDocument();
    expect(screen.queryByText('13/01/2026', { exact: false })).not.toBeInTheDocument();
  });

  test('filtra por situação, texto e data', async () => {
    render(<AdminReservas />);
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
  });

  test('cancela a reserva de qualquer usuário depois de confirmar', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<AdminReservas />);
    await screen.findByText('Bia');
    fireEvent.click(itemDe('Bia').getByRole('button', { name: 'Cancelar' }));
    expect(confirmar).toHaveBeenCalledWith('Cancelar a reserva de Bia em Sala 2?');
    expect(await screen.findByText('Reserva cancelada.')).toBeInTheDocument();
    expect(api.cancelarReserva).toHaveBeenCalledWith(2);
  });

  test('não cancela sem confirmação e mostra erro quando falha', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AdminReservas />);
    await screen.findByText('Bia');
    fireEvent.click(itemDe('Bia').getByRole('button', { name: 'Cancelar' }));
    expect(api.cancelarReserva).not.toHaveBeenCalled();

    confirmar.mockReturnValue(true);
    api.cancelarReserva.mockRejectedValue(new Error('Falhou.'));
    fireEvent.click(itemDe('Bia').getByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByText('Falhou.')).toBeInTheDocument();
  });

  test('edita a reserva e fecha o formulário', async () => {
    render(<AdminReservas />);
    await screen.findByText('Bia');
    fireEvent.click(itemDe('Bia').getByRole('button', { name: 'Editar' }));
    const form = within(screen.getByRole('button', { name: 'Salvar alterações' }).closest('form'));
    expect(form.getByLabelText('Sala')).toHaveValue('2');
    fireEvent.click(form.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Reserva alterada com sucesso!')).toBeInTheDocument();
    expect(api.editarReserva).toHaveBeenCalledWith(2, { salaId: 2, data: '2026-01-12', horaInicio: '10:00', horaFim: '11:00' });
  });

  test('Voltar fecha a edição', async () => {
    render(<AdminReservas />);
    await screen.findByText('Bia');
    fireEvent.click(itemDe('Bia').getByRole('button', { name: 'Editar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument();
  });

  test('mostra o erro ao carregar', async () => {
    api.todasReservas.mockRejectedValue(new Error('Sem conexão.'));
    render(<AdminReservas />);
    expect(await screen.findByText('Sem conexão.')).toBeInTheDocument();
  });
});

describe('AdminSalas', () => {
  function preencher(campos) {
    for (const [rotulo, valor] of Object.entries(campos)) {
      fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
    }
  }

  test('lista as salas cadastradas', async () => {
    render(<AdminSalas />);
    expect(await screen.findByText('Laboratório · 30 lugares')).toBeInTheDocument();
    expect(screen.getByText('sem recursos')).toBeInTheDocument();
  });

  test('avisa quando não há salas e mostra erro ao carregar', async () => {
    api.listarSalas.mockRejectedValue(new Error('Sem conexão.'));
    render(<AdminSalas />);
    expect(await screen.findByText('Sem conexão.')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma sala cadastrada.')).toBeInTheDocument();
  });

  test('cadastra uma sala com o nome sem espaços e a capacidade numérica', async () => {
    render(<AdminSalas />);
    await screen.findByText('Lab 1');
    preencher({ Nome: '  Sala 3 ', Tipo: 'LABORATORIO', Capacidade: '12', Recursos: 'Projetor' });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar sala' }));
    expect(await screen.findByText('Sala cadastrada com sucesso!')).toBeInTheDocument();
    expect(api.criarSala).toHaveBeenCalledWith({ nome: 'Sala 3', tipo: 'LABORATORIO', capacidade: 12, recursos: 'Projetor' });
    expect(screen.getByLabelText('Nome')).toHaveValue('');
  });

  test('valida os dados antes de enviar', async () => {
    render(<AdminSalas />);
    await screen.findByText('Lab 1');
    preencher({ Nome: 'Sala 3', Capacidade: '0' });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar sala' }));
    expect(screen.getByRole('alert')).toHaveTextContent('A capacidade deve ser um número inteiro maior que zero.');
    expect(api.criarSala).not.toHaveBeenCalled();
  });

  test('mostra o erro do servidor ao salvar', async () => {
    api.criarSala.mockRejectedValue(new Error('Tipo de sala inválido.'));
    render(<AdminSalas />);
    await screen.findByText('Lab 1');
    preencher({ Nome: 'Sala 3', Capacidade: '3' });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar sala' }));
    expect(await screen.findByText('Tipo de sala inválido.')).toBeInTheDocument();
  });

  test('edita uma sala e volta ao modo de cadastro', async () => {
    render(<AdminSalas />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Lab 1' }));
    expect(screen.getByRole('heading', { name: 'Editar sala' })).toBeInTheDocument();
    expect(screen.getByLabelText('Capacidade')).toHaveValue(30);

    preencher({ Capacidade: '35' });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Sala alterada com sucesso!')).toBeInTheDocument();
    expect(api.atualizarSala).toHaveBeenCalledWith(1, { nome: 'Lab 1', tipo: 'LABORATORIO', capacidade: 35, recursos: 'PCs' });
    expect(screen.getByRole('heading', { name: 'Nova sala' })).toBeInTheDocument();
  });

  test('Voltar desiste da edição', async () => {
    render(<AdminSalas />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Lab 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByRole('heading', { name: 'Nova sala' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toHaveValue('');
  });

  test('exclui a sala avisando que as reservas também serão excluídas', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<AdminSalas />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Lab 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Lab 1' }));
    expect(confirmar.mock.calls[0][0]).toMatch(/Todas as reservas desta sala também serão excluídas/);
    expect(await screen.findByText('Sala excluída.')).toBeInTheDocument();
    expect(api.excluirSala).toHaveBeenCalledWith(1);
    // Estava editando a sala excluída: o formulário volta para o cadastro.
    expect(screen.getByRole('heading', { name: 'Nova sala' })).toBeInTheDocument();
  });

  test('excluir outra sala mantém a edição em andamento', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<AdminSalas />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Lab 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Sala 2' }));
    expect(await screen.findByText('Sala excluída.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Editar sala' })).toBeInTheDocument();
  });

  test('não exclui sem confirmação e mostra erro quando falha', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AdminSalas />);
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir Lab 1' }));
    expect(api.excluirSala).not.toHaveBeenCalled();

    confirmar.mockReturnValue(true);
    api.excluirSala.mockRejectedValue(new Error('Falhou.'));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Lab 1' }));
    expect(await screen.findByText('Falhou.')).toBeInTheDocument();
  });
});

describe('AdminUsuarios', () => {
  test('lista os usuários e não deixa o administrador alterar a si mesmo', async () => {
    render(<AdminUsuarios usuario={eu} />);
    expect(await screen.findByText('Carla (você)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir Carla' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Tipo de Ana' })).toHaveValue('ALUNO');
  });

  test('altera o tipo de outro usuário e recarrega a lista', async () => {
    render(<AdminUsuarios usuario={eu} />);
    fireEvent.change(await screen.findByRole('combobox', { name: 'Tipo de Ana' }), { target: { value: 'PROFESSOR' } });
    expect(await screen.findByText('Ana agora é Professor.')).toBeInTheDocument();
    expect(api.alterarTipoUsuario).toHaveBeenCalledWith(1, 'PROFESSOR');
    expect(api.listarUsuarios).toHaveBeenCalledTimes(2);
  });

  test('mostra o erro ao alterar o tipo e ao carregar', async () => {
    api.alterarTipoUsuario.mockRejectedValue(new Error('Não permitido.'));
    render(<AdminUsuarios usuario={eu} />);
    fireEvent.change(await screen.findByRole('combobox', { name: 'Tipo de Ana' }), { target: { value: 'ADMIN' } });
    expect(await screen.findByText('Não permitido.')).toBeInTheDocument();
  });

  test('mostra o erro quando não consegue listar', async () => {
    api.listarUsuarios.mockRejectedValue(new Error('Sem conexão.'));
    render(<AdminUsuarios usuario={eu} />);
    expect(await screen.findByText('Sem conexão.')).toBeInTheDocument();
  });

  test('exclui o usuário depois de confirmar', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<AdminUsuarios usuario={eu} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir Ana' }));
    expect(confirmar.mock.calls[0][0]).toMatch(/Excluir o usuário Ana\?/);
    expect(await screen.findByText('Usuário excluído.')).toBeInTheDocument();
    expect(api.excluirUsuario).toHaveBeenCalledWith(1);
  });

  test('não exclui sem confirmação e mostra erro quando falha', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AdminUsuarios usuario={eu} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir Ana' }));
    expect(api.excluirUsuario).not.toHaveBeenCalled();

    confirmar.mockReturnValue(true);
    api.excluirUsuario.mockRejectedValue(new Error('Falhou.'));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Ana' }));
    expect(await screen.findByText('Falhou.')).toBeInTheDocument();
  });
});
