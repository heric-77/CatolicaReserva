import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from '../../src/pages/Login.jsx';
import { api } from '../../src/api.js';

vi.mock('../../src/api.js', async () => (await import('../apiFalsa.js')).criarApiFalsa());

const sessao = { token: 't', usuario: { id: 1, nome: 'Ana', tipo: 'ALUNO' } };

function preencher(rotulo, valor) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

describe('Login', () => {
  let aoEntrar;

  beforeEach(() => {
    aoEntrar = vi.fn();
    api.login.mockResolvedValue(sessao);
    api.registrar.mockResolvedValue({});
  });

  test('faz login e entrega a sessão ao App', async () => {
    render(<Login aoEntrar={aoEntrar} />);
    preencher('E-mail', 'ana@x.com');
    preencher('Senha', '123');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(aoEntrar).toHaveBeenCalledWith(sessao));
    expect(api.login).toHaveBeenCalledWith({ email: 'ana@x.com', senha: '123' });
    expect(api.registrar).not.toHaveBeenCalled();
  });

  test('mostra o erro do servidor', async () => {
    api.login.mockRejectedValue(new Error('E-mail ou senha inválidos.'));
    render(<Login aoEntrar={aoEntrar} />);
    preencher('E-mail', 'ana@x.com');
    preencher('Senha', 'x');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeInTheDocument();
    expect(aoEntrar).not.toHaveBeenCalled();
  });

  test('mostra a mensagem recebida do App (ex: sessão expirada)', () => {
    render(<Login aoEntrar={aoEntrar} mensagem="Sua sessão expirou. Entre novamente." />);
    expect(screen.getByRole('status')).toHaveTextContent('Sua sessão expirou.');
  });

  test('no cadastro registra com o nome sem espaços extras e já entra', async () => {
    render(<Login aoEntrar={aoEntrar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cadastre-se' }));
    expect(screen.getByRole('heading', { name: 'Criar conta' })).toBeInTheDocument();

    preencher('Nome', '  Bia  ');
    preencher('E-mail', 'bia@x.com');
    preencher('Senha', '123');
    preencher('Tipo', 'PROFESSOR');
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar e entrar' }));

    await waitFor(() => expect(aoEntrar).toHaveBeenCalled());
    expect(api.registrar).toHaveBeenCalledWith({ nome: 'Bia', email: 'bia@x.com', senha: '123', tipo: 'PROFESSOR' });
  });

  test('no cadastro recusa nome em branco sem chamar a API', () => {
    render(<Login aoEntrar={aoEntrar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cadastre-se' }));
    preencher('Nome', '   ');
    preencher('E-mail', 'bia@x.com');
    preencher('Senha', '123');
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar e entrar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o seu nome.');
    expect(api.registrar).not.toHaveBeenCalled();
  });

  test('voltar para o login esconde os campos de cadastro', () => {
    render(<Login aoEntrar={aoEntrar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cadastre-se' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fazer login' }));
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toHaveAttribute('autocomplete', 'current-password');
  });
});
