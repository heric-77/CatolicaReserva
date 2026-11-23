// Testes de ponta a ponta da camada HTTP: o app Express é montado como no
// container, mas com os repositórios em memória no lugar do MySQL.
const { test, describe, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const criarApp = require('../../src/app');
const AuthController = require('../../src/http/controllers/AuthController');
const SalaController = require('../../src/http/controllers/SalaController');
const ReservaController = require('../../src/http/controllers/ReservaController');
const UsuarioController = require('../../src/http/controllers/UsuarioController');
const AgendaController = require('../../src/http/controllers/AgendaController');
const { criarAutenticacao } = require('../../src/http/middlewares/autenticacao');
const JwtServicoToken = require('../../src/infra/seguranca/JwtServicoToken');
const ReservaService = require('../../src/services/ReservaService');
const SalaService = require('../../src/services/SalaService');
const UsuarioService = require('../../src/services/UsuarioService');
const GestaoDeUsuariosService = require('../../src/services/GestaoDeUsuariosService');
const AgendaService = require('../../src/services/AgendaService');
const CamposObrigatorios = require('../../src/dominio/regras/reserva/CamposObrigatorios');
const HorarioValido = require('../../src/dominio/regras/reserva/HorarioValido');
const SalaDeveExistir = require('../../src/dominio/regras/reserva/SalaDeveExistir');
const SemConflitoDeHorario = require('../../src/dominio/regras/reserva/SemConflitoDeHorario');
const ApenasDonoOuAdmin = require('../../src/dominio/regras/alteracao/ApenasDonoOuAdmin');
const SomenteReservaAtiva = require('../../src/dominio/regras/alteracao/SomenteReservaAtiva');
const {
  ReservaRepositoryEmMemoria,
  SalaRepositoryEmMemoria,
  UsuarioRepositoryEmMemoria,
  GeradorHashFalso,
} = require('../fakes/emMemoria');

const DATA = '2099-01-10';
const servicoToken = new JwtServicoToken({ segredo: 'segredo-de-teste' });
const ORIGEM_DO_CLIENTE = 'http://localhost:5173';

let servidor;
let base;
let repos;

function montarApp() {
  const reservaRepository = new ReservaRepositoryEmMemoria();
  const salaRepository = new SalaRepositoryEmMemoria([
    { id: 1, nome: 'Lab 1', tipo: 'LABORATORIO', capacidade: 30, recursos: 'PCs' },
  ]);
  const usuarioRepository = new UsuarioRepositoryEmMemoria();
  repos = { reservaRepository, salaRepository, usuarioRepository };

  const reservaService = new ReservaService({
    reservaRepository,
    regrasDeReserva: [
      new CamposObrigatorios(),
      new HorarioValido(),
      new SalaDeveExistir({ consultaDeSala: salaRepository }),
      new SemConflitoDeHorario({ agendaDeReservas: reservaRepository }),
    ],
    regrasDeEdicao: [new ApenasDonoOuAdmin({ acao: 'editar' }), new SomenteReservaAtiva()],
    regrasDeCancelamento: [new ApenasDonoOuAdmin({ acao: 'cancelar' })],
  });

  return criarApp({
    authController: new AuthController({
      usuarioService: new UsuarioService({
        usuarioRepository,
        geradorHash: new GeradorHashFalso(),
        geradorToken: servicoToken,
      }),
    }),
    salaController: new SalaController({ salaService: new SalaService({ salaRepository }) }),
    reservaController: new ReservaController({ reservaService }),
    usuarioController: new UsuarioController({
      gestaoDeUsuariosService: new GestaoDeUsuariosService({ gestaoDeUsuariosRepository: usuarioRepository }),
    }),
    agendaController: new AgendaController({
      agendaService: new AgendaService({ agendaDoDia: reservaRepository, abertura: '07:00', fechamento: '22:00' }),
    }),
    autenticar: criarAutenticacao(servicoToken),
    origemPermitida: ORIGEM_DO_CLIENTE,
  });
}

// Faz a requisição e devolve { status, corpo }.
async function chamar(metodo, caminho, { token, corpo } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const resposta = await fetch(base + caminho, {
    method: metodo,
    headers,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await resposta.text();
  return { status: resposta.status, corpo: texto ? JSON.parse(texto) : null };
}

const tokenDe = (usuario) => servicoToken.gerar({ id: usuario.id, nome: usuario.nome, tipo: usuario.tipo });
const aluno = { id: 1, nome: 'Ana', tipo: 'ALUNO' };
const outroAluno = { id: 2, nome: 'Bia', tipo: 'ALUNO' };
const admin = { id: 3, nome: 'Carla', tipo: 'ADMIN' };
const novaReserva = { salaId: 1, data: DATA, horaInicio: '10:00', horaFim: '11:00' };

// Um único servidor numa porta livre; o app é recriado a cada teste,
// para que um teste não veja os dados gravados por outro.
let app;

before(async () => {
  servidor = http.createServer((req, res) => app(req, res));
  await new Promise((resolve) => servidor.listen(0, resolve));
  base = `http://127.0.0.1:${servidor.address().port}/api`;
});

beforeEach(() => {
  app = montarApp();
});

after(() => new Promise((resolve) => servidor.close(resolve)));

describe('API: rota de saúde', () => {
  test('GET /api informa que a API está no ar', async () => {
    const { status, corpo } = await chamar('GET', '');
    assert.equal(status, 200);
    assert.deepEqual(corpo, { nome: 'CatólicaReserva API', status: 'ok' });
  });
});

describe('API: CORS', () => {
  async function origemLiberada(origem) {
    const resposta = await fetch(base, { headers: { Origin: origem } });
    return resposta.headers.get('access-control-allow-origin');
  }

  test('libera apenas a origem do cliente web', async () => {
    assert.equal(await origemLiberada(ORIGEM_DO_CLIENTE), ORIGEM_DO_CLIENTE);
  });

  test('não libera outros sites', async () => {
    assert.notEqual(await origemLiberada('https://site-malicioso.example'), 'https://site-malicioso.example');
  });
});

describe('API: autenticação', () => {
  test('registra (201), faz login e não devolve o hash da senha', async () => {
    const registro = await chamar('POST', '/auth/registrar', {
      corpo: { nome: 'Ana', email: 'ana@x.com', senha: '123' },
    });
    assert.equal(registro.status, 201);
    assert.deepEqual(registro.corpo, { id: 1, nome: 'Ana', email: 'ana@x.com', tipo: 'ALUNO' });

    const login = await chamar('POST', '/auth/login', { corpo: { email: 'ana@x.com', senha: '123' } });
    assert.equal(login.status, 200);
    assert.equal(servicoToken.verificar(login.corpo.token).id, 1);
    assert.equal(login.corpo.usuario.senhaHash, undefined);
  });

  test('dados inválidos viram 400, e-mail repetido 409 e senha errada 401', async () => {
    assert.equal((await chamar('POST', '/auth/registrar', { corpo: {} })).status, 400);
    await chamar('POST', '/auth/registrar', { corpo: { nome: 'Ana', email: 'ana@x.com', senha: '123' } });
    const repetido = await chamar('POST', '/auth/registrar', {
      corpo: { nome: 'Ana', email: 'ana@x.com', senha: '123' },
    });
    assert.equal(repetido.status, 409);
    const login = await chamar('POST', '/auth/login', { corpo: { email: 'ana@x.com', senha: 'x' } });
    assert.equal(login.status, 401);
    assert.equal(login.corpo.erro, 'E-mail ou senha inválidos.');
  });
});

describe('API: middleware de autenticação', () => {
  test('sem token responde 401', async () => {
    const { status, corpo } = await chamar('GET', '/salas');
    assert.equal(status, 401);
    assert.equal(corpo.erro, 'Token não informado. Faça login.');
  });

  test('token inválido responde 401', async () => {
    const { status, corpo } = await chamar('GET', '/salas', { token: 'token-invalido' });
    assert.equal(status, 401);
    assert.equal(corpo.erro, 'Token inválido ou expirado.');
  });

  test('rota de administrador recusa usuário comum com 403', async () => {
    const { status, corpo } = await chamar('GET', '/usuarios', { token: tokenDe(aluno) });
    assert.equal(status, 403);
    assert.equal(corpo.erro, 'Acesso restrito.');
  });
});

describe('API: salas', () => {
  test('qualquer usuário logado lista as salas', async () => {
    const { status, corpo } = await chamar('GET', '/salas', { token: tokenDe(aluno) });
    assert.equal(status, 200);
    assert.deepEqual(corpo, [{ id: 1, nome: 'Lab 1', tipo: 'LABORATORIO', capacidade: 30, recursos: 'PCs' }]);
  });

  test('o administrador cria, altera e exclui salas', async () => {
    const token = tokenDe(admin);
    const criada = await chamar('POST', '/salas', {
      token,
      corpo: { nome: 'Sala 2', tipo: 'SALA_ESTUDO', capacidade: 4 },
    });
    assert.equal(criada.status, 201);
    assert.equal(criada.corpo.id, 2);

    const alterada = await chamar('PUT', '/salas/2', {
      token,
      corpo: { nome: 'Sala 2B', tipo: 'SALA_ESTUDO', capacidade: 6 },
    });
    assert.equal(alterada.status, 200);
    assert.equal(alterada.corpo.nome, 'Sala 2B');

    const excluida = await chamar('DELETE', '/salas/2', { token });
    assert.equal(excluida.status, 204);
    assert.equal(excluida.corpo, null);
  });

  test('aluno não pode cadastrar sala', async () => {
    const { status } = await chamar('POST', '/salas', {
      token: tokenDe(aluno),
      corpo: { nome: 'X', tipo: 'SALA_ESTUDO', capacidade: 1 },
    });
    assert.equal(status, 403);
  });

  test('sala inexistente responde 404', async () => {
    assert.equal((await chamar('DELETE', '/salas/99', { token: tokenDe(admin) })).status, 404);
  });
});

describe('API: reservas', () => {
  test('cria a reserva com o usuário do token e devolve os campos em snake_case', async () => {
    const { status, corpo } = await chamar('POST', '/reservas', { token: tokenDe(aluno), corpo: novaReserva });
    assert.equal(status, 201);
    assert.equal(corpo.usuario_id, aluno.id);
    assert.equal(corpo.sala_id, 1);
    assert.equal(corpo.hora_inicio, '10:00:00');
    assert.equal(corpo.status, 'ATIVA');
  });

  test('horário ocupado responde 409', async () => {
    await chamar('POST', '/reservas', { token: tokenDe(aluno), corpo: novaReserva });
    const { status } = await chamar('POST', '/reservas', { token: tokenDe(outroAluno), corpo: novaReserva });
    assert.equal(status, 409);
  });

  test('lista só as reservas do usuário logado', async () => {
    await chamar('POST', '/reservas', { token: tokenDe(aluno), corpo: novaReserva });
    await chamar('POST', '/reservas', {
      token: tokenDe(outroAluno),
      corpo: { ...novaReserva, horaInicio: '12:00', horaFim: '13:00' },
    });
    const { corpo } = await chamar('GET', '/reservas/minhas', { token: tokenDe(aluno) });
    assert.equal(corpo.length, 1);
    assert.equal(corpo[0].usuario_id, aluno.id);
  });

  test('só o administrador lista todas as reservas', async () => {
    await chamar('POST', '/reservas', { token: tokenDe(aluno), corpo: novaReserva });
    assert.equal((await chamar('GET', '/reservas', { token: tokenDe(aluno) })).status, 403);
    const { status, corpo } = await chamar('GET', '/reservas', { token: tokenDe(admin) });
    assert.equal(status, 200);
    assert.equal(corpo.length, 1);
  });

  test('o dono edita a reserva; outro usuário recebe 403', async () => {
    await chamar('POST', '/reservas', { token: tokenDe(aluno), corpo: novaReserva });
    const alteracao = { ...novaReserva, horaInicio: '14:00', horaFim: '15:00' };
    assert.equal((await chamar('PUT', '/reservas/1', { token: tokenDe(outroAluno), corpo: alteracao })).status, 403);
    const { status, corpo } = await chamar('PUT', '/reservas/1', { token: tokenDe(aluno), corpo: alteracao });
    assert.equal(status, 200);
    assert.equal(corpo.hora_inicio, '14:00:00');
  });

  test('cancela a reserva', async () => {
    await chamar('POST', '/reservas', { token: tokenDe(aluno), corpo: novaReserva });
    const { status, corpo } = await chamar('PATCH', '/reservas/1/cancelar', { token: tokenDe(aluno) });
    assert.equal(status, 200);
    assert.equal(corpo.status, 'CANCELADA');
  });

  test('id que não é número não casa com a rota (404 do Express)', async () => {
    const resposta = await fetch(`${base}/reservas/abc/cancelar`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDe(aluno)}` },
    });
    assert.equal(resposta.status, 404);
  });
});

describe('API: agenda', () => {
  test('mostra os horários ocupados sem revelar quem reservou', async () => {
    await chamar('POST', '/reservas', { token: tokenDe(aluno), corpo: novaReserva });
    const { status, corpo } = await chamar('GET', `/agenda?data=${DATA}`, { token: tokenDe(outroAluno) });
    assert.equal(status, 200);
    assert.deepEqual(corpo, {
      data: DATA,
      abertura: '07:00',
      fechamento: '22:00',
      ocupadas: [{ sala_id: 1, hora_inicio: '10:00:00', hora_fim: '11:00:00' }],
    });
  });

  test('data inválida responde 400', async () => {
    const { status } = await chamar('GET', '/agenda?data=2099-02-31', { token: tokenDe(aluno) });
    assert.equal(status, 400);
  });
});

describe('API: gestão de usuários', () => {
  beforeEach(async () => {
    await repos.usuarioRepository.salvar({ nome: 'Ana', email: 'ana@x.com', senhaHash: 'h', tipo: 'ALUNO' });
    await repos.usuarioRepository.salvar({ nome: 'Bia', email: 'bia@x.com', senhaHash: 'h', tipo: 'ALUNO' });
    await repos.usuarioRepository.salvar({ nome: 'Carla', email: 'carla@x.com', senhaHash: 'h', tipo: 'ADMIN' });
  });

  test('o administrador lista os usuários sem o hash da senha', async () => {
    const { status, corpo } = await chamar('GET', '/usuarios', { token: tokenDe(admin) });
    assert.equal(status, 200);
    assert.equal(corpo.length, 3);
    assert.ok(corpo.every((u) => u.senhaHash === undefined));
  });

  test('altera o tipo de outro usuário', async () => {
    const { status, corpo } = await chamar('PATCH', '/usuarios/1/tipo', {
      token: tokenDe(admin),
      corpo: { tipo: 'PROFESSOR' },
    });
    assert.equal(status, 200);
    assert.equal(corpo.tipo, 'PROFESSOR');
  });

  test('exclui outro usuário, mas não a si mesmo', async () => {
    assert.equal((await chamar('DELETE', '/usuarios/2', { token: tokenDe(admin) })).status, 204);
    assert.equal((await chamar('DELETE', '/usuarios/3', { token: tokenDe(admin) })).status, 403);
  });
});

describe('API: erro inesperado', () => {
  test('responde 500 com mensagem genérica e registra o erro no console', async () => {
    const consoleError = mock.method(console, 'error', () => {});
    repos.salaRepository.listar = async () => {
      throw new Error('detalhe interno do banco');
    };
    const { status, corpo } = await chamar('GET', '/salas', { token: tokenDe(aluno) });
    assert.equal(status, 500);
    assert.equal(corpo.erro, 'Erro interno no servidor.');
    assert.equal(consoleError.mock.callCount(), 1);
    consoleError.mock.restore();
  });
});
