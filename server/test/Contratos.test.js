// Garante que toda implementação cumpre o contrato inteiro (Liskov / ISP):
// nenhuma classe pode "esquecer" um método da interface que implementa.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const ReservaRepository = require('../src/dominio/contratos/ReservaRepository');
const AgendaDeReservas = require('../src/dominio/contratos/AgendaDeReservas');
const AgendaDoDia = require('../src/dominio/contratos/AgendaDoDia');
const SalaRepository = require('../src/dominio/contratos/SalaRepository');
const ConsultaDeSala = require('../src/dominio/contratos/ConsultaDeSala');
const GestaoDeUsuariosRepository = require('../src/dominio/contratos/GestaoDeUsuariosRepository');
const UsuarioRepository = require('../src/dominio/contratos/UsuarioRepository');
const GeradorHash = require('../src/dominio/contratos/GeradorHash');
const GeradorToken = require('../src/dominio/contratos/GeradorToken');
const VerificadorToken = require('../src/dominio/contratos/VerificadorToken');

const MySqlReservaRepository = require('../src/infra/mysql/MySqlReservaRepository');
const MySqlSalaRepository = require('../src/infra/mysql/MySqlSalaRepository');
const MySqlUsuarioRepository = require('../src/infra/mysql/MySqlUsuarioRepository');
const BcryptGeradorHash = require('../src/infra/seguranca/BcryptGeradorHash');
const JwtServicoToken = require('../src/infra/seguranca/JwtServicoToken');
const fakes = require('./fakes/emMemoria');

const poolFalso = {};

describe('Implementações reais cumprem seus contratos', () => {
  const casos = [
    [ReservaRepository, new MySqlReservaRepository(poolFalso)],
    [AgendaDeReservas, new MySqlReservaRepository(poolFalso)],
    [AgendaDoDia, new MySqlReservaRepository(poolFalso)],
    [SalaRepository, new MySqlSalaRepository(poolFalso)],
    [ConsultaDeSala, new MySqlSalaRepository(poolFalso)],
    [GestaoDeUsuariosRepository, new MySqlUsuarioRepository(poolFalso)],
    [UsuarioRepository, new MySqlUsuarioRepository(poolFalso)],
    [GeradorHash, new BcryptGeradorHash()],
    [GeradorToken, new JwtServicoToken({ segredo: 'x' })],
    [VerificadorToken, new JwtServicoToken({ segredo: 'x' })],
  ];
  for (const [contrato, implementacao] of casos) {
    test(`${implementacao.constructor.name} cumpre ${contrato.nome}`, () => {
      assert.doesNotThrow(() => contrato.verificar(implementacao));
    });
  }
});

describe('Fakes de teste cumprem os mesmos contratos', () => {
  test('repositórios em memória', () => {
    const reservas = new fakes.ReservaRepositoryEmMemoria();
    ReservaRepository.verificar(reservas);
    AgendaDeReservas.verificar(reservas);
    AgendaDoDia.verificar(reservas);
    SalaRepository.verificar(new fakes.SalaRepositoryEmMemoria());
    ConsultaDeSala.verificar(new fakes.SalaRepositoryEmMemoria());
    UsuarioRepository.verificar(new fakes.UsuarioRepositoryEmMemoria());
    GestaoDeUsuariosRepository.verificar(new fakes.UsuarioRepositoryEmMemoria());
  });
});

describe('Contrato.verificar', () => {
  test('acusa a implementação incompleta e diz o que falta', () => {
    class RepositorioIncompleto {
      async listar() {}
    }
    assert.throws(
      () => SalaRepository.verificar(new RepositorioIncompleto()),
      /RepositorioIncompleto não implementa o contrato SalaRepository: faltando buscarPorId, salvar, atualizar, remover/
    );
  });
});
