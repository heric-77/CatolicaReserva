const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const Reserva = require('../src/dominio/entidades/Reserva');
const FormatoDeDataEHora = require('../src/dominio/regras/reserva/FormatoDeDataEHora');
const HorarioDeFuncionamento = require('../src/dominio/regras/reserva/HorarioDeFuncionamento');
const LimiteDeDuracao = require('../src/dominio/regras/reserva/LimiteDeDuracao');
const SemHorarioNoPassado = require('../src/dominio/regras/reserva/SemHorarioNoPassado');
const AntecedenciaMaxima = require('../src/dominio/regras/reserva/AntecedenciaMaxima');
const { DadosInvalidosError } = require('../src/dominio/erros');

function reserva(dados) {
  return new Reserva({ usuarioId: 1, salaId: 1, data: '2030-06-10', horaInicio: '10:00', horaFim: '11:00', ...dados });
}

// O "momento atual" fica fixo para o resultado não depender do dia em que o teste roda.
const agora = () => new Date('2030-06-10T12:00:00');

describe('FormatoDeDataEHora', () => {
  const regra = new FormatoDeDataEHora();

  test('aceita data e horas válidas', async () => {
    await regra.validar(reserva());
  });

  test('recusa data que não existe', async () => {
    await assert.rejects(regra.validar(reserva({ data: '2030-02-31' })), DadosInvalidosError);
  });

  test('recusa data em outro formato', async () => {
    await assert.rejects(regra.validar(reserva({ data: '10/06/2030' })), DadosInvalidosError);
  });

  test('recusa hora inválida', async () => {
    await assert.rejects(regra.validar(reserva({ horaFim: '25:00' })), DadosInvalidosError);
  });
});

describe('HorarioDeFuncionamento', () => {
  const regra = new HorarioDeFuncionamento({ abertura: '07:00', fechamento: '22:00' });

  test('aceita reserva exatamente entre a abertura e o fechamento', async () => {
    await regra.validar(reserva({ horaInicio: '07:00', horaFim: '22:00' }));
  });

  test('recusa início antes da abertura', async () => {
    await assert.rejects(regra.validar(reserva({ horaInicio: '06:59' })), /entre 07:00 e 22:00/);
  });

  test('recusa fim depois do fechamento', async () => {
    await assert.rejects(regra.validar(reserva({ horaFim: '22:30' })), /entre 07:00 e 22:00/);
  });
});

describe('LimiteDeDuracao', () => {
  const regra = new LimiteDeDuracao({ maximoEmMinutos: 240 });

  test('aceita exatamente o limite', async () => {
    await regra.validar(reserva({ horaInicio: '08:00', horaFim: '12:00' }));
  });

  test('recusa um minuto acima do limite', async () => {
    await assert.rejects(
      regra.validar(reserva({ horaInicio: '08:00', horaFim: '12:01' })),
      /no máximo 4 horas/
    );
  });
});

describe('SemHorarioNoPassado', () => {
  const regra = new SemHorarioNoPassado({ agora });

  test('aceita horário futuro no mesmo dia', async () => {
    await regra.validar(reserva({ horaInicio: '12:01', horaFim: '13:00' }));
  });

  test('recusa horário que já começou', async () => {
    await assert.rejects(regra.validar(reserva({ horaInicio: '12:00', horaFim: '13:00' })), DadosInvalidosError);
  });

  test('recusa dia anterior', async () => {
    await assert.rejects(regra.validar(reserva({ data: '2030-06-09' })), DadosInvalidosError);
  });
});

describe('AntecedenciaMaxima', () => {
  const regra = new AntecedenciaMaxima({ maximoEmDias: 30, agora });

  test('aceita dentro do limite', async () => {
    await regra.validar(reserva({ data: '2030-07-10', horaInicio: '12:00', horaFim: '13:00' }));
  });

  test('recusa além do limite', async () => {
    await assert.rejects(
      regra.validar(reserva({ data: '2030-07-11', horaInicio: '12:00', horaFim: '13:00' })),
      /até 30 dias de antecedência/
    );
  });
});
