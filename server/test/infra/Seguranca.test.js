const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const BcryptGeradorHash = require('../../src/infra/seguranca/BcryptGeradorHash');
const JwtServicoToken = require('../../src/infra/seguranca/JwtServicoToken');

describe('BcryptGeradorHash', () => {
  // custo baixo deixa o teste rápido; em produção o padrão é 10.
  const geradorHash = new BcryptGeradorHash({ custo: 4 });

  test('gera um hash diferente da senha e confere a senha certa', async () => {
    const hash = await geradorHash.gerar('segredo123');
    assert.notEqual(hash, 'segredo123');
    assert.equal(await geradorHash.comparar('segredo123', hash), true);
    assert.equal(await geradorHash.comparar('errada', hash), false);
  });

  test('usa custo 10 quando nenhum é informado', () => {
    assert.equal(new BcryptGeradorHash().custo, 10);
  });
});

describe('JwtServicoToken', () => {
  const servico = new JwtServicoToken({ segredo: 'segredo-de-teste' });

  test('o token gerado é aceito na verificação e carrega os dados do usuário', () => {
    const token = servico.gerar({ id: 1, nome: 'Ana', tipo: 'ALUNO' });
    const dados = servico.verificar(token);
    assert.equal(dados.id, 1);
    assert.equal(dados.tipo, 'ALUNO');
  });

  test('recusa token assinado com outro segredo', () => {
    const outro = new JwtServicoToken({ segredo: 'outro-segredo' });
    assert.throws(() => servico.verificar(outro.gerar({ id: 1 })));
  });

  test('recusa token expirado', () => {
    const expirado = new JwtServicoToken({ segredo: 'segredo-de-teste', expiracao: -1 });
    assert.throws(() => servico.verificar(expirado.gerar({ id: 1 })), /expired/);
  });
});
