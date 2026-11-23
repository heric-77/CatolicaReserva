// Teste de INTEGRAÇÃO: usa um MySQL de verdade (não os fakes em memória).
// Confere que os repositórios MySQL, o schema.sql e as regras de negócio
// funcionam juntos: o que o sistema grava é o que ele lê de volta do banco.
//
// Precisa de um MySQL de teste (ver documentacao/PLANO_DE_TESTES.md):
//   docker run -d --name catolicareserva-mysql-teste -p 3307:3306 -e MYSQL_ROOT_PASSWORD=teste mysql:8.4
// Uso: npm run test:integracao
const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

const { criarPool } = require('../../src/infra/mysql/conexao');
const MySqlReservaRepository = require('../../src/infra/mysql/MySqlReservaRepository');
const MySqlSalaRepository = require('../../src/infra/mysql/MySqlSalaRepository');
const MySqlUsuarioRepository = require('../../src/infra/mysql/MySqlUsuarioRepository');
const ReservaService = require('../../src/services/ReservaService');
const CamposObrigatorios = require('../../src/dominio/regras/reserva/CamposObrigatorios');
const HorarioValido = require('../../src/dominio/regras/reserva/HorarioValido');
const SalaDeveExistir = require('../../src/dominio/regras/reserva/SalaDeveExistir');
const SemConflitoDeHorario = require('../../src/dominio/regras/reserva/SemConflitoDeHorario');
const ApenasDonoOuAdmin = require('../../src/dominio/regras/alteracao/ApenasDonoOuAdmin');
const SomenteReservaAtiva = require('../../src/dominio/regras/alteracao/SomenteReservaAtiva');
const Sala = require('../../src/dominio/entidades/Sala');
const Usuario = require('../../src/dominio/entidades/Usuario');
const { ConflitoError } = require('../../src/dominio/erros');

// Banco exclusivo dos testes: é apagado e recriado a cada execução.
const BANCO_DE_TESTE = 'catolicareserva_teste';
const conexaoDeTeste = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: Number(process.env.TEST_DB_PORT) || 3307,
  user: process.env.TEST_DB_USER || 'root',
  password: process.env.TEST_DB_PASSWORD || 'teste',
};
const DATA = '2099-03-10';

let pool;
let reservas;
let salas;
let usuarios;
let service;
let ana;
let bia;
let lab;

// Cria o banco de teste usando o MESMO schema.sql da aplicação.
async function criarBancoDeTeste() {
  const schema = fs
    .readFileSync(path.join(__dirname, '../../src/database/schema.sql'), 'utf8')
    .replaceAll('catolicareserva', BANCO_DE_TESTE);
  const conexao = await mysql.createConnection({ ...conexaoDeTeste, multipleStatements: true });
  try {
    await conexao.query(`DROP DATABASE IF EXISTS ${BANCO_DE_TESTE}`);
    await conexao.query(schema);
  } finally {
    await conexao.end();
  }
}

async function contar(tabela) {
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM ${tabela}`);
  return total;
}

before(async () => {
  await criarBancoDeTeste();
  pool = criarPool({ ...conexaoDeTeste, database: BANCO_DE_TESTE });
  reservas = new MySqlReservaRepository(pool);
  salas = new MySqlSalaRepository(pool);
  usuarios = new MySqlUsuarioRepository(pool);
  service = new ReservaService({
    reservaRepository: reservas,
    regrasDeReserva: [
      new CamposObrigatorios(),
      new HorarioValido(),
      new SalaDeveExistir({ consultaDeSala: salas }),
      new SemConflitoDeHorario({ agendaDeReservas: reservas }),
    ],
    regrasDeEdicao: [new ApenasDonoOuAdmin({ acao: 'editar' }), new SomenteReservaAtiva()],
    regrasDeCancelamento: [new ApenasDonoOuAdmin({ acao: 'cancelar' })],
  });
});

// Cada teste começa com o banco vazio e os mesmos dados iniciais.
beforeEach(async () => {
  await pool.query('DELETE FROM reservas');
  await pool.query('DELETE FROM salas');
  await pool.query('DELETE FROM usuarios');
  ana = await usuarios.salvar(new Usuario({ nome: 'Ana', email: 'ana@x.com', senhaHash: 'h1' }));
  bia = await usuarios.salvar(new Usuario({ nome: 'Bia', email: 'bia@x.com', senhaHash: 'h2' }));
  lab = await salas.salvar(Sala.criar({ nome: 'Lab 1', tipo: 'LABORATORIO', capacidade: 30, recursos: 'PCs' }));
});

after(async () => {
  await pool?.end();
});

const reservaDe = (usuario, dados = {}) => ({
  usuarioId: usuario.id, salaId: lab.id, data: DATA, horaInicio: '10:00', horaFim: '11:00', ...dados,
});

describe('Integração com o MySQL: persistência', () => {
  test('a reserva criada é gravada no banco e lida de volta com os mesmos dados', async () => {
    const criada = await service.criar(reservaDe(ana));

    const lida = await reservas.buscarPorId(criada.id);
    assert.equal(lida.usuarioId, ana.id);
    assert.equal(lida.salaId, lab.id);
    assert.equal(lida.data, DATA); // DATE volta como 'AAAA-MM-DD', sem mudar de dia pelo fuso
    assert.equal(lida.horaInicio, '10:00:00');
    assert.equal(lida.horaFim, '11:00:00');
    assert.equal(lida.status, 'ATIVA');
    assert.equal(lida.salaNome, 'Lab 1'); // nomes vêm do JOIN com salas e usuarios
    assert.equal(lida.usuarioNome, 'Ana');
    assert.equal(await contar('reservas'), 1);
  });

  test('RF06: o banco não fica com duas reservas ativas no mesmo horário da sala', async () => {
    await service.criar(reservaDe(ana));
    await assert.rejects(
      service.criar(reservaDe(bia, { horaInicio: '10:30', horaFim: '11:30' })),
      ConflitoError
    );
    assert.equal(await contar('reservas'), 1);

    // Encostar no fim da outra reserva não é conflito.
    await service.criar(reservaDe(bia, { horaInicio: '11:00', horaFim: '12:00' }));
    assert.equal(await contar('reservas'), 2);
  });

  test('o cancelamento é gravado e libera o horário para outra reserva', async () => {
    const reserva = await service.criar(reservaDe(ana));
    const cancelada = await service.cancelar(reserva.id, { id: ana.id, tipo: 'ALUNO' });
    assert.equal(cancelada.status, 'CANCELADA');
    assert.deepEqual(await reservas.buscarAtivasPorSalaEData(lab.id, DATA), []);

    await service.criar(reservaDe(bia));
    const doDia = await reservas.buscarAtivasPorData(DATA);
    assert.deepEqual(doDia.map((r) => r.usuarioId), [bia.id]);
  });

  test('a edição é gravada e a própria reserva não conta como conflito', async () => {
    const reserva = await service.criar(reservaDe(ana));
    await service.editar(
      reserva.id,
      { salaId: lab.id, data: DATA, horaInicio: '10:30', horaFim: '11:30' },
      { id: ana.id, tipo: 'ALUNO' }
    );
    const lida = await reservas.buscarPorId(reserva.id);
    assert.equal(lida.horaInicio, '10:30:00');
    assert.equal(lida.horaFim, '11:30:00');
  });

  test('lista as reservas do usuário e todas as reservas, com os nomes do JOIN', async () => {
    await service.criar(reservaDe(ana));
    await service.criar(reservaDe(bia, { horaInicio: '14:00', horaFim: '15:00' }));
    assert.deepEqual((await reservas.listarPorUsuario(ana.id)).map((r) => r.usuarioNome), ['Ana']);
    assert.equal((await reservas.listarTodas()).length, 2);
  });

  test('excluir a sala apaga as reservas dela na mesma transação', async () => {
    await service.criar(reservaDe(ana));
    await salas.remover(lab.id);
    assert.equal(await salas.buscarPorId(lab.id), null);
    assert.equal(await contar('reservas'), 0);
  });

  test('excluir o usuário apaga as reservas dele e mantém as dos outros', async () => {
    await service.criar(reservaDe(ana));
    await service.criar(reservaDe(bia, { horaInicio: '14:00', horaFim: '15:00' }));
    await usuarios.remover(ana.id);
    assert.equal(await usuarios.buscarPorId(ana.id), null);
    assert.deepEqual((await reservas.listarTodas()).map((r) => r.usuarioId), [bia.id]);
  });

  test('salas e usuários são gravados e atualizados', async () => {
    const alterada = await salas.atualizar(new Sala({ ...lab, capacidade: 35 }));
    assert.equal(alterada.capacidade, 35);
    assert.equal((await usuarios.buscarPorEmail('bia@x.com')).senhaHash, 'h2');
    assert.equal((await usuarios.atualizarTipo(bia.id, 'PROFESSOR')).tipo, 'PROFESSOR');
  });

  test('o banco recusa e-mail repetido (UNIQUE) e reserva de sala que não existe (FOREIGN KEY)', async () => {
    await assert.rejects(
      usuarios.salvar(new Usuario({ nome: 'Outra Ana', email: 'ana@x.com', senhaHash: 'h' })),
      { code: 'ER_DUP_ENTRY' }
    );
    await assert.rejects(
      pool.query(
        'INSERT INTO reservas (usuario_id, sala_id, data, hora_inicio, hora_fim) VALUES (?, ?, ?, ?, ?)',
        [ana.id, 9999, DATA, '10:00', '11:00']
      ),
      { code: 'ER_NO_REFERENCED_ROW_2' }
    );
  });
});
