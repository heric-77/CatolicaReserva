import { beforeEach, describe, expect, test, vi } from 'vitest';
import { api, EVENTO_SESSAO_EXPIRADA } from '../src/api.js';

// Resposta falsa no formato do fetch.
function resposta(status, corpo) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: corpo === undefined ? () => Promise.reject(new SyntaxError('sem corpo')) : () => Promise.resolve(corpo),
  };
}

let fetchFalso;

beforeEach(() => {
  fetchFalso = vi.fn();
  vi.stubGlobal('fetch', fetchFalso);
});

describe('api', () => {
  test('envia o token no cabeçalho quando o usuário está logado', async () => {
    localStorage.setItem('token', 'abc');
    fetchFalso.mockResolvedValue(resposta(200, []));
    await api.listarSalas();
    const [url, opcoes] = fetchFalso.mock.calls[0];
    expect(url).toBe('/api/salas');
    expect(opcoes.headers.Authorization).toBe('Bearer abc');
  });

  test('não envia Authorization sem token', async () => {
    fetchFalso.mockResolvedValue(resposta(200, { token: 't' }));
    await api.login({ email: 'a@x.com', senha: '1' });
    const [, opcoes] = fetchFalso.mock.calls[0];
    expect(opcoes.headers.Authorization).toBeUndefined();
    expect(opcoes.method).toBe('POST');
    expect(JSON.parse(opcoes.body)).toEqual({ email: 'a@x.com', senha: '1' });
  });

  test('204 devolve null sem tentar ler o corpo', async () => {
    fetchFalso.mockResolvedValue(resposta(204));
    await expect(api.excluirSala(3)).resolves.toBeNull();
    expect(fetchFalso.mock.calls[0][0]).toBe('/api/salas/3');
    expect(fetchFalso.mock.calls[0][1].method).toBe('DELETE');
  });

  test('erro do servidor vira Error com a mensagem enviada por ele', async () => {
    fetchFalso.mockResolvedValue(resposta(409, { erro: 'Horário ocupado.' }));
    await expect(api.criarReserva({})).rejects.toThrow('Horário ocupado.');
  });

  test('erro sem corpo JSON usa mensagem genérica', async () => {
    fetchFalso.mockResolvedValue(resposta(500));
    await expect(api.todasReservas()).rejects.toThrow('Não foi possível concluir a operação.');
  });

  test('falha de rede vira mensagem amigável', async () => {
    fetchFalso.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api.minhasReservas()).rejects.toThrow('Não foi possível conectar ao servidor.');
  });

  test('401 com token avisa que a sessão expirou', async () => {
    localStorage.setItem('token', 'expirado');
    const ouvinte = vi.fn();
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);
    fetchFalso.mockResolvedValue(resposta(401, { erro: 'Token inválido ou expirado.' }));
    await expect(api.listarUsuarios()).rejects.toThrow('Token inválido ou expirado.');
    expect(ouvinte).toHaveBeenCalledOnce();
    window.removeEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);
  });

  test('401 sem token (login errado) não dispara a expiração de sessão', async () => {
    const ouvinte = vi.fn();
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);
    fetchFalso.mockResolvedValue(resposta(401, { erro: 'E-mail ou senha inválidos.' }));
    await expect(api.login({})).rejects.toThrow('E-mail ou senha inválidos.');
    expect(ouvinte).not.toHaveBeenCalled();
    window.removeEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);
  });

  test.each([
    ['registrar', [{}], '/api/auth/registrar', 'POST'],
    ['criarSala', [{}], '/api/salas', 'POST'],
    ['atualizarSala', [2, {}], '/api/salas/2', 'PUT'],
    ['editarReserva', [4, {}], '/api/reservas/4', 'PUT'],
    ['cancelarReserva', [4], '/api/reservas/4/cancelar', 'PATCH'],
    ['agendaDoDia', ['2026-01-10'], '/api/agenda?data=2026-01-10', undefined],
    ['alterarTipoUsuario', [5, 'ADMIN'], '/api/usuarios/5/tipo', 'PATCH'],
    ['excluirUsuario', [5], '/api/usuarios/5', 'DELETE'],
  ])('%s chama a rota certa', async (metodo, argumentos, url, verbo) => {
    fetchFalso.mockResolvedValue(resposta(200, {}));
    await api[metodo](...argumentos);
    expect(fetchFalso.mock.calls[0][0]).toBe(url);
    expect(fetchFalso.mock.calls[0][1].method).toBe(verbo);
  });
});
