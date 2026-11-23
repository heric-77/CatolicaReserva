const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const Reserva = require('../src/dominio/entidades/Reserva');
const Sala = require('../src/dominio/entidades/Sala');
const Usuario = require('../src/dominio/entidades/Usuario');
const { DadosInvalidosError } = require('../src/dominio/erros');

describe('Reserva', () => {
  const base = { id: 1, usuarioId: 7, salaId: 1, data: '2099-01-10', horaInicio: '10:00', horaFim: '11:30' };

  test('padroniza as horas em HH:MM:SS e começa ativa', () => {
    const reserva = new Reserva(base);
    assert.equal(reserva.horaInicio, '10:00:00');
    assert.equal(reserva.horaFim, '11:30:00');
    assert.equal(reserva.estaAtiva(), true);
  });

  test('calcula a duração em minutos', () => {
    assert.equal(new Reserva(base).duracaoEmMinutos(), 90);
  });

  test('intervalos que só se encostam não se sobrepõem', () => {
    const a = new Reserva(base);
    const b = new Reserva({ ...base, horaInicio: '11:30', horaFim: '12:00' });
    assert.equal(a.sobrepoe(b), false);
    assert.equal(a.sobrepoe(new Reserva({ ...base, horaInicio: '11:00', horaFim: '12:00' })), true);
  });

  test('comAlteracoes devolve uma cópia sem mudar a original', () => {
    const original = new Reserva(base);
    const alterada = original.comAlteracoes({ salaId: 2, data: '2099-01-11', horaInicio: '08:00', horaFim: '09:00' });
    assert.equal(alterada.id, 1);
    assert.equal(alterada.salaId, 2);
    assert.equal(original.salaId, 1);
  });

  test('cancelar muda o status', () => {
    const reserva = new Reserva(base);
    reserva.cancelar();
    assert.equal(reserva.status, Reserva.STATUS.CANCELADA);
    assert.equal(reserva.estaAtiva(), false);
  });
});

describe('Sala', () => {
  test('criar valida e converte a capacidade para número', () => {
    const sala = Sala.criar({ nome: 'Lab', tipo: 'LABORATORIO', capacidade: '20' });
    assert.equal(sala.capacidade, 20);
    assert.equal(sala.recursos, '');
  });

  test('recusa sala sem nome, tipo ou capacidade', () => {
    assert.throws(() => Sala.criar({ tipo: 'LABORATORIO', capacidade: 10 }), DadosInvalidosError);
  });

  test('recusa tipo inválido e capacidade que não é maior que zero', () => {
    assert.throws(() => Sala.criar({ nome: 'Lab', tipo: 'AUDITORIO', capacidade: 10 }), DadosInvalidosError);
    assert.throws(() => Sala.criar({ nome: 'Lab', tipo: 'LABORATORIO', capacidade: -3 }), DadosInvalidosError);
    assert.throws(() => Sala.criar({ nome: 'Lab', tipo: 'LABORATORIO', capacidade: 'abc' }), DadosInvalidosError);
  });
});

describe('Usuario', () => {
  test('ehAdmin só é verdadeiro para administradores', () => {
    assert.equal(new Usuario({ tipo: 'ADMIN' }).ehAdmin(), true);
    assert.equal(new Usuario({}).ehAdmin(), false);
  });

  test('o cadastro público não permite criar administrador', () => {
    assert.throws(
      () => Usuario.validarCadastro({ nome: 'A', email: 'a@x.com', senha: '1', tipo: 'ADMIN' }),
      DadosInvalidosError
    );
    assert.doesNotThrow(() => Usuario.validarCadastro({ nome: 'A', email: 'a@x.com', senha: '1', tipo: 'PROFESSOR' }));
  });
});
