const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const GestaoDeUsuariosService = require('../src/services/GestaoDeUsuariosService');
const Usuario = require('../src/dominio/entidades/Usuario');
const {
  AcessoNegadoError,
  DadosInvalidosError,
  NaoEncontradoError,
} = require('../src/dominio/erros');
const { UsuarioRepositoryEmMemoria } = require('./fakes/emMemoria');

async function montar() {
  const repository = new UsuarioRepositoryEmMemoria();
  await repository.salvar(new Usuario({ nome: 'Admin', email: 'a@x.com', senhaHash: 'h', tipo: 'ADMIN' }));
  await repository.salvar(new Usuario({ nome: 'Ana', email: 'ana@x.com', senhaHash: 'h', tipo: 'ALUNO' }));
  return { service: new GestaoDeUsuariosService({ gestaoDeUsuariosRepository: repository }), repository };
}

const admin = { id: 1, tipo: 'ADMIN' };

describe('GestaoDeUsuariosService', () => {
  test('lista os usuários', async () => {
    const { service } = await montar();
    assert.equal((await service.listar()).length, 2);
  });

  test('altera o tipo de outro usuário', async () => {
    const { service } = await montar();
    const usuario = await service.alterarTipo(2, 'PROFESSOR', admin);
    assert.equal(usuario.tipo, 'PROFESSOR');
  });

  test('recusa tipo inválido', async () => {
    const { service } = await montar();
    await assert.rejects(service.alterarTipo(2, 'REI', admin), DadosInvalidosError);
  });

  test('o administrador não altera o próprio tipo', async () => {
    const { service } = await montar();
    await assert.rejects(service.alterarTipo(1, 'ALUNO', admin), AcessoNegadoError);
  });

  test('remove outro usuário', async () => {
    const { service, repository } = await montar();
    await service.remover(2, admin);
    assert.equal(await repository.buscarPorId(2), null);
  });

  test('o administrador não remove a si mesmo', async () => {
    const { service } = await montar();
    await assert.rejects(service.remover(1, admin), AcessoNegadoError);
  });

  test('usuário inexistente', async () => {
    const { service } = await montar();
    await assert.rejects(service.alterarTipo(99, 'ALUNO', admin), NaoEncontradoError);
    await assert.rejects(service.remover(99, admin), NaoEncontradoError);
  });
});
