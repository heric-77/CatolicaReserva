const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const UsuarioService = require('../src/services/UsuarioService');
const {
  DadosInvalidosError,
  ConflitoError,
  CredenciaisInvalidasError,
} = require('../src/dominio/erros');
const {
  UsuarioRepositoryEmMemoria,
  GeradorHashFalso,
  GeradorTokenFalso,
} = require('./fakes/emMemoria');

function montar() {
  return new UsuarioService({
    usuarioRepository: new UsuarioRepositoryEmMemoria(),
    geradorHash: new GeradorHashFalso(),
    geradorToken: new GeradorTokenFalso(),
  });
}

describe('UsuarioService', () => {
  test('registra com tipo ALUNO por padrão e guarda só o hash da senha', async () => {
    const service = montar();
    const usuario = await service.registrar({ nome: 'Ana', email: 'ana@x.com', senha: '123' });
    assert.equal(usuario.tipo, 'ALUNO');
    assert.equal(usuario.senhaHash, 'hash(123)');
  });

  test('recusa campos obrigatórios faltando', async () => {
    await assert.rejects(montar().registrar({ email: 'ana@x.com' }), DadosInvalidosError);
  });

  test('recusa tipo de usuário inválido', async () => {
    await assert.rejects(
      montar().registrar({ nome: 'Ana', email: 'ana@x.com', senha: '1', tipo: 'REI' }),
      DadosInvalidosError
    );
  });

  test('recusa e-mail repetido', async () => {
    const service = montar();
    await service.registrar({ nome: 'Ana', email: 'ana@x.com', senha: '123' });
    await assert.rejects(
      service.registrar({ nome: 'Ana 2', email: 'ana@x.com', senha: '456' }),
      ConflitoError
    );
  });

  test('autentica e devolve o token', async () => {
    const service = montar();
    await service.registrar({ nome: 'Ana', email: 'ana@x.com', senha: '123' });
    const { token, usuario } = await service.autenticar({ email: 'ana@x.com', senha: '123' });
    assert.equal(token, `token-${usuario.id}`);
  });

  test('recusa senha errada e e-mail desconhecido com a mesma mensagem', async () => {
    const service = montar();
    await service.registrar({ nome: 'Ana', email: 'ana@x.com', senha: '123' });
    await assert.rejects(service.autenticar({ email: 'ana@x.com', senha: 'x' }), CredenciaisInvalidasError);
    await assert.rejects(service.autenticar({ email: 'nao@x.com', senha: '123' }), CredenciaisInvalidasError);
  });
});
