const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const MySqlReservaRepository = require('../../src/infra/mysql/MySqlReservaRepository');
const MySqlSalaRepository = require('../../src/infra/mysql/MySqlSalaRepository');
const MySqlUsuarioRepository = require('../../src/infra/mysql/MySqlUsuarioRepository');
const { emTransacao } = require('../../src/infra/mysql/transacao');
const Reserva = require('../../src/dominio/entidades/Reserva');
const Sala = require('../../src/dominio/entidades/Sala');
const Usuario = require('../../src/dominio/entidades/Usuario');
const PoolFalso = require('../fakes/poolFalso');

const linhaReserva = {
  id: 5,
  usuario_id: 7,
  sala_id: 1,
  data: '2099-01-10',
  hora_inicio: '10:00:00',
  hora_fim: '11:00:00',
  status: 'ATIVA',
  sala_nome: 'Lab 1',
  usuario_nome: 'Ana',
};
const linhaSala = { id: 1, nome: 'Lab 1', tipo: 'LABORATORIO', capacidade: 30, recursos: 'PCs' };
const linhaUsuario = { id: 3, nome: 'Ana', email: 'ana@x.com', senha: 'hash', tipo: 'ALUNO' };

describe('MySqlReservaRepository', () => {
  test('converte a linha do banco (snake_case) na entidade Reserva', async () => {
    const repo = new MySqlReservaRepository(new PoolFalso([[linhaReserva]]));
    const reserva = await repo.buscarPorId(5);
    assert.ok(reserva instanceof Reserva);
    assert.equal(reserva.usuarioId, 7);
    assert.equal(reserva.salaNome, 'Lab 1');
    assert.equal(reserva.usuarioNome, 'Ana');
  });

  test('buscarPorId devolve null quando não encontra', async () => {
    const repo = new MySqlReservaRepository(new PoolFalso([[]]));
    assert.equal(await repo.buscarPorId(99), null);
  });

  test('sem o JOIN, sala_nome e usuario_nome ficam null', async () => {
    const { sala_nome, usuario_nome, ...semJoin } = linhaReserva;
    const repo = new MySqlReservaRepository(new PoolFalso([[semJoin]]));
    const [reserva] = await repo.buscarAtivasPorSalaEData(1, '2099-01-10');
    assert.equal(reserva.salaNome, null);
    assert.equal(reserva.usuarioNome, null);
  });

  test('salvar insere e busca a reserva gravada pelo insertId', async () => {
    const pool = new PoolFalso([{ insertId: 5 }, [linhaReserva]]);
    const repo = new MySqlReservaRepository(pool);
    const salva = await repo.salvar(new Reserva({ ...linhaReserva, id: null, usuarioId: 7, salaId: 1, horaInicio: '10:00', horaFim: '11:00' }));
    assert.equal(salva.id, 5);
    assert.match(pool.consultas[0].sql, /^INSERT INTO reservas/);
    assert.deepEqual(pool.consultas[0].parametros, [7, 1, '2099-01-10', '10:00:00', '11:00:00', 'ATIVA']);
    assert.deepEqual(pool.consultas[1].parametros, [5]);
  });

  test('as buscas da agenda filtram apenas reservas ativas', async () => {
    const pool = new PoolFalso([[linhaReserva], [linhaReserva]]);
    const repo = new MySqlReservaRepository(pool);
    await repo.buscarAtivasPorSalaEData(1, '2099-01-10');
    await repo.buscarAtivasPorData('2099-01-10');
    assert.deepEqual(pool.consultas[0].parametros, [1, '2099-01-10', 'ATIVA']);
    assert.deepEqual(pool.consultas[1].parametros, ['2099-01-10', 'ATIVA']);
  });

  test('lista as reservas de um usuário e todas as reservas', async () => {
    const pool = new PoolFalso([[linhaReserva], [linhaReserva, linhaReserva]]);
    const repo = new MySqlReservaRepository(pool);
    assert.equal((await repo.listarPorUsuario(7)).length, 1);
    assert.equal((await repo.listarTodas()).length, 2);
    assert.deepEqual(pool.consultas[0].parametros, [7]);
  });

  test('atualizar e atualizarStatus gravam e devolvem a reserva atualizada', async () => {
    const pool = new PoolFalso([{}, [linhaReserva], {}, [{ ...linhaReserva, status: 'CANCELADA' }]]);
    const repo = new MySqlReservaRepository(pool);
    await repo.atualizar(new Reserva({ id: 5, salaId: 2, data: '2099-01-11', horaInicio: '08:00', horaFim: '09:00' }));
    const cancelada = await repo.atualizarStatus(5, 'CANCELADA');
    assert.deepEqual(pool.consultas[0].parametros, [2, '2099-01-11', '08:00:00', '09:00:00', 5]);
    assert.deepEqual(pool.consultas[2].parametros, ['CANCELADA', 5]);
    assert.equal(cancelada.status, 'CANCELADA');
  });
});

describe('MySqlSalaRepository', () => {
  test('lista e busca salas convertendo para a entidade Sala', async () => {
    const repo = new MySqlSalaRepository(new PoolFalso([[linhaSala], [linhaSala], []]));
    const [sala] = await repo.listar();
    assert.ok(sala instanceof Sala);
    assert.equal((await repo.buscarPorId(1)).nome, 'Lab 1');
    assert.equal(await repo.buscarPorId(99), null);
  });

  test('salvar devolve a sala com o id gerado', async () => {
    const pool = new PoolFalso([{ insertId: 8 }]);
    const repo = new MySqlSalaRepository(pool);
    const salva = await repo.salvar(new Sala({ nome: 'Sala 2', tipo: 'SALA_ESTUDO', capacidade: 4 }));
    assert.equal(salva.id, 8);
    assert.deepEqual(pool.consultas[0].parametros, ['Sala 2', 'SALA_ESTUDO', 4, '']);
  });

  test('atualizar grava os novos dados', async () => {
    const pool = new PoolFalso([{}, [linhaSala]]);
    const repo = new MySqlSalaRepository(pool);
    await repo.atualizar(new Sala(linhaSala));
    assert.deepEqual(pool.consultas[0].parametros, ['Lab 1', 'LABORATORIO', 30, 'PCs', 1]);
  });

  test('remover apaga as reservas da sala e a sala na mesma transação', async () => {
    const pool = new PoolFalso();
    await new MySqlSalaRepository(pool).remover(1);
    assert.match(pool.consultas[0].sql, /DELETE FROM reservas WHERE sala_id/);
    assert.match(pool.consultas[1].sql, /DELETE FROM salas/);
    assert.deepEqual(pool.conexao.eventos, ['begin', 'commit', 'release']);
  });
});

describe('MySqlUsuarioRepository', () => {
  test('busca por e-mail e converte a coluna senha em senhaHash', async () => {
    const repo = new MySqlUsuarioRepository(new PoolFalso([[linhaUsuario], []]));
    const usuario = await repo.buscarPorEmail('ana@x.com');
    assert.ok(usuario instanceof Usuario);
    assert.equal(usuario.senhaHash, 'hash');
    assert.equal(await repo.buscarPorEmail('nao@existe.com'), null);
  });

  test('salvar devolve o usuário com o id gerado', async () => {
    const pool = new PoolFalso([{ insertId: 4 }]);
    const repo = new MySqlUsuarioRepository(pool);
    const salvo = await repo.salvar(new Usuario({ nome: 'Bia', email: 'bia@x.com', senhaHash: 'h' }));
    assert.equal(salvo.id, 4);
    assert.deepEqual(pool.consultas[0].parametros, ['Bia', 'bia@x.com', 'h', 'ALUNO']);
  });

  test('lista, busca por id e altera o tipo', async () => {
    const pool = new PoolFalso([[linhaUsuario], [linhaUsuario], [], {}, [{ ...linhaUsuario, tipo: 'ADMIN' }]]);
    const repo = new MySqlUsuarioRepository(pool);
    assert.equal((await repo.listar()).length, 1);
    assert.equal((await repo.buscarPorId(3)).nome, 'Ana');
    assert.equal(await repo.buscarPorId(99), null);
    const alterado = await repo.atualizarTipo(3, 'ADMIN');
    assert.equal(alterado.tipo, 'ADMIN');
    assert.deepEqual(pool.consultas[3].parametros, ['ADMIN', 3]);
  });

  test('remover apaga as reservas do usuário e o usuário na mesma transação', async () => {
    const pool = new PoolFalso();
    await new MySqlUsuarioRepository(pool).remover(3);
    assert.match(pool.consultas[0].sql, /DELETE FROM reservas WHERE usuario_id/);
    assert.match(pool.consultas[1].sql, /DELETE FROM usuarios/);
    assert.deepEqual(pool.conexao.eventos, ['begin', 'commit', 'release']);
  });
});

describe('emTransacao', () => {
  test('desfaz tudo e repassa o erro quando uma operação falha', async () => {
    const pool = new PoolFalso([{}, new Error('falha no banco')]);
    await assert.rejects(
      emTransacao(pool, async (conexao) => {
        await conexao.query('DELETE 1');
        await conexao.query('DELETE 2');
      }),
      /falha no banco/
    );
    assert.deepEqual(pool.conexao.eventos, ['begin', 'rollback', 'release']);
  });
});
