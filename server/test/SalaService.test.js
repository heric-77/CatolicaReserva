const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const SalaService = require('../src/services/SalaService');
const { DadosInvalidosError, NaoEncontradoError } = require('../src/dominio/erros');
const { SalaRepositoryEmMemoria } = require('./fakes/emMemoria');

function montar() {
  const salaRepository = new SalaRepositoryEmMemoria([
    { id: 1, nome: 'Lab 1', tipo: 'LABORATORIO', capacidade: 30 },
  ]);
  return { service: new SalaService({ salaRepository }), salaRepository };
}

const novosDados = { nome: 'Lab 2', tipo: 'SALA_ESTUDO', capacidade: '8', recursos: 'Quadro' };

describe('SalaService', () => {
  test('atualiza os dados da sala mantendo o id', async () => {
    const { service } = montar();
    const sala = await service.atualizar(1, novosDados);
    assert.equal(sala.id, 1);
    assert.equal(sala.nome, 'Lab 2');
    assert.equal(sala.capacidade, 8);
  });

  test('não atualiza com dados inválidos', async () => {
    const { service } = montar();
    await assert.rejects(service.atualizar(1, { ...novosDados, capacidade: 'abc' }), DadosInvalidosError);
    await assert.rejects(service.atualizar(1, { ...novosDados, tipo: 'CASA' }), DadosInvalidosError);
  });

  test('não atualiza sala inexistente', async () => {
    const { service } = montar();
    await assert.rejects(service.atualizar(99, novosDados), NaoEncontradoError);
  });

  test('remove a sala', async () => {
    const { service, salaRepository } = montar();
    await service.remover(1);
    assert.equal((await salaRepository.listar()).length, 0);
  });

  test('não remove sala inexistente', async () => {
    const { service } = montar();
    await assert.rejects(service.remover(99), NaoEncontradoError);
  });
});
