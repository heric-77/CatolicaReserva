const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const ReservaService = require('../src/services/ReservaService');
const CamposObrigatorios = require('../src/dominio/regras/reserva/CamposObrigatorios');
const HorarioValido = require('../src/dominio/regras/reserva/HorarioValido');
const SalaDeveExistir = require('../src/dominio/regras/reserva/SalaDeveExistir');
const SemConflitoDeHorario = require('../src/dominio/regras/reserva/SemConflitoDeHorario');
const ApenasDonoOuAdmin = require('../src/dominio/regras/alteracao/ApenasDonoOuAdmin');
const SomenteReservaAtiva = require('../src/dominio/regras/alteracao/SomenteReservaAtiva');
const {
  DadosInvalidosError,
  NaoEncontradoError,
  ConflitoError,
  AcessoNegadoError,
} = require('../src/dominio/erros');
const { ReservaRepositoryEmMemoria, SalaRepositoryEmMemoria } = require('./fakes/emMemoria');

const DATA = '2099-01-10';

// Monta o service do mesmo jeito que o container, mas com os fakes em memória.
function montar({ reservas = [], regrasExtras = [] } = {}) {
  const reservaRepository = new ReservaRepositoryEmMemoria(reservas);
  const salaRepository = new SalaRepositoryEmMemoria([
    { id: 1, nome: 'Lab 1', tipo: 'LABORATORIO', capacidade: 30 },
  ]);
  const service = new ReservaService({
    reservaRepository,
    regrasDeReserva: [
      new CamposObrigatorios(),
      new HorarioValido(),
      new SalaDeveExistir({ consultaDeSala: salaRepository }),
      new SemConflitoDeHorario({ agendaDeReservas: reservaRepository }),
      ...regrasExtras,
    ],
    regrasDeEdicao: [new ApenasDonoOuAdmin({ acao: 'editar' }), new SomenteReservaAtiva()],
    regrasDeCancelamento: [new ApenasDonoOuAdmin({ acao: 'cancelar' })],
  });
  return { service, reservaRepository };
}

const reservaDas10as11 = {
  id: 1, usuarioId: 7, salaId: 1, data: DATA, horaInicio: '10:00:00', horaFim: '11:00:00',
};

describe('ReservaService.criar', () => {
  test('cria a reserva quando todas as regras passam', async () => {
    const { service } = montar();
    const reserva = await service.criar({ usuarioId: 7, salaId: 1, data: DATA, horaInicio: '10:00', horaFim: '11:00' });
    assert.equal(reserva.status, 'ATIVA');
    assert.equal(reserva.horaInicio, '10:00:00');
  });

  test('recusa campos faltando', async () => {
    const { service } = montar();
    await assert.rejects(service.criar({ usuarioId: 7, salaId: 1 }), DadosInvalidosError);
  });

  test('recusa hora de fim antes da hora de início', async () => {
    const { service } = montar();
    await assert.rejects(
      service.criar({ usuarioId: 7, salaId: 1, data: DATA, horaInicio: '11:00', horaFim: '10:00' }),
      DadosInvalidosError
    );
  });

  test('recusa sala inexistente', async () => {
    const { service } = montar();
    await assert.rejects(
      service.criar({ usuarioId: 7, salaId: 99, data: DATA, horaInicio: '10:00', horaFim: '11:00' }),
      NaoEncontradoError
    );
  });

  test('recusa horário que se sobrepõe a uma reserva ativa', async () => {
    const { service } = montar({ reservas: [reservaDas10as11] });
    await assert.rejects(
      service.criar({ usuarioId: 8, salaId: 1, data: DATA, horaInicio: '10:30', horaFim: '11:30' }),
      ConflitoError
    );
  });

  test('aceita reserva que começa exatamente quando a outra termina', async () => {
    const { service } = montar({ reservas: [reservaDas10as11] });
    const reserva = await service.criar({ usuarioId: 8, salaId: 1, data: DATA, horaInicio: '11:00', horaFim: '12:00' });
    assert.equal(reserva.status, 'ATIVA');
  });

  test('ignora reservas canceladas na checagem de conflito', async () => {
    const { service } = montar({ reservas: [{ ...reservaDas10as11, status: 'CANCELADA' }] });
    const reserva = await service.criar({ usuarioId: 8, salaId: 1, data: DATA, horaInicio: '10:00', horaFim: '11:00' });
    assert.equal(reserva.status, 'ATIVA');
  });

  // Demonstração do Open/Closed: uma regra nova entra SEM alterar o ReservaService.
  test('aceita regras novas sem modificar o service (OCP)', async () => {
    class LimiteDeDuasHoras {
      async validar(reserva) {
        const horas = (r) => Number(r.slice(0, 2)) + Number(r.slice(3, 5)) / 60;
        if (horas(reserva.horaFim) - horas(reserva.horaInicio) > 2) {
          throw new DadosInvalidosError('Uma reserva pode durar no máximo 2 horas.');
        }
      }
    }
    const { service } = montar({ regrasExtras: [new LimiteDeDuasHoras()] });
    await assert.rejects(
      service.criar({ usuarioId: 7, salaId: 1, data: DATA, horaInicio: '08:00', horaFim: '11:00' }),
      /no máximo 2 horas/
    );
  });
});

describe('ReservaService.editar', () => {
  const novoHorario = { salaId: 1, data: DATA, horaInicio: '14:00', horaFim: '15:00' };

  test('o dono consegue alterar o horário', async () => {
    const { service } = montar({ reservas: [reservaDas10as11] });
    const reserva = await service.editar(1, novoHorario, { id: 7, tipo: 'ALUNO' });
    assert.equal(reserva.horaInicio, '14:00:00');
    assert.equal(reserva.usuarioId, 7);
  });

  test('a reserva não conflita com ela mesma', async () => {
    const { service } = montar({ reservas: [reservaDas10as11] });
    const reserva = await service.editar(
      1,
      { salaId: 1, data: DATA, horaInicio: '10:30', horaFim: '11:30' },
      { id: 7, tipo: 'ALUNO' }
    );
    assert.equal(reserva.horaFim, '11:30:00');
  });

  test('recusa horário que conflita com outra reserva', async () => {
    const outra = { ...reservaDas10as11, id: 2, usuarioId: 8, horaInicio: '14:00:00', horaFim: '16:00:00' };
    const { service } = montar({ reservas: [reservaDas10as11, outra] });
    await assert.rejects(service.editar(1, novoHorario, { id: 7, tipo: 'ALUNO' }), ConflitoError);
  });

  test('outro aluno não consegue editar', async () => {
    const { service } = montar({ reservas: [reservaDas10as11] });
    await assert.rejects(
      service.editar(1, novoHorario, { id: 8, tipo: 'ALUNO' }),
      /permissão para editar/
    );
  });

  test('o administrador consegue editar reserva de outra pessoa, sem mudar o dono', async () => {
    const { service } = montar({ reservas: [reservaDas10as11] });
    const reserva = await service.editar(1, novoHorario, { id: 1, tipo: 'ADMIN' });
    assert.equal(reserva.usuarioId, 7);
  });

  test('não edita reserva cancelada', async () => {
    const { service } = montar({ reservas: [{ ...reservaDas10as11, status: 'CANCELADA' }] });
    await assert.rejects(service.editar(1, novoHorario, { id: 7, tipo: 'ALUNO' }), ConflitoError);
  });

  test('reserva inexistente', async () => {
    const { service } = montar();
    await assert.rejects(service.editar(99, novoHorario, { id: 7, tipo: 'ALUNO' }), NaoEncontradoError);
  });
});

describe('ReservaService.cancelar', () => {
  test('o dono consegue cancelar', async () => {
    const { service } = montar({ reservas: [reservaDas10as11] });
    const reserva = await service.cancelar(1, { id: 7, tipo: 'ALUNO' });
    assert.equal(reserva.status, 'CANCELADA');
  });

  test('o administrador consegue cancelar reserva de outra pessoa', async () => {
    const { service } = montar({ reservas: [reservaDas10as11] });
    const reserva = await service.cancelar(1, { id: 1, tipo: 'ADMIN' });
    assert.equal(reserva.status, 'CANCELADA');
  });

  test('outro aluno não consegue cancelar', async () => {
    const { service } = montar({ reservas: [reservaDas10as11] });
    await assert.rejects(service.cancelar(1, { id: 8, tipo: 'ALUNO' }), AcessoNegadoError);
  });

  test('reserva inexistente', async () => {
    const { service } = montar();
    await assert.rejects(service.cancelar(99, { id: 7, tipo: 'ALUNO' }), NaoEncontradoError);
  });
});
