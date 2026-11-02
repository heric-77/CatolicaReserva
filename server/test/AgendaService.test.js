const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const AgendaService = require('../src/services/AgendaService');
const { DadosInvalidosError } = require('../src/dominio/erros');
const { ReservaRepositoryEmMemoria } = require('./fakes/emMemoria');

const base = { usuarioId: 1, salaId: 1, horaInicio: '10:00', horaFim: '11:00' };

function montar() {
  const agendaDoDia = new ReservaRepositoryEmMemoria([
    { ...base, id: 1, data: '2030-06-10' },
    { ...base, id: 2, data: '2030-06-10', salaId: 2 },
    { ...base, id: 3, data: '2030-06-10', status: 'CANCELADA', horaInicio: '14:00', horaFim: '15:00' },
    { ...base, id: 4, data: '2030-06-11' },
  ]);
  return new AgendaService({ agendaDoDia, abertura: '07:00', fechamento: '22:00' });
}

describe('AgendaService', () => {
  test('traz só as reservas ativas da data, de todas as salas', async () => {
    const agenda = await montar().doDia('2030-06-10');
    assert.deepEqual(agenda.ocupadas.map((r) => r.id), [1, 2]);
  });

  test('informa o horário de funcionamento', async () => {
    const agenda = await montar().doDia('2030-06-10');
    assert.equal(agenda.abertura, '07:00');
    assert.equal(agenda.fechamento, '22:00');
  });

  test('recusa data inválida ou ausente', async () => {
    await assert.rejects(montar().doDia('amanha'), DadosInvalidosError);
    await assert.rejects(montar().doDia(undefined), DadosInvalidosError);
  });
});
