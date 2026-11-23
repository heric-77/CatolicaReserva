import { describe, expect, test } from 'vitest';
import {
  agruparPorData,
  horasNoMes,
  ocupacaoDaSala,
  posicaoNoDia,
  proximoHorario,
  separarReservas,
  situacaoDaSala,
  sobrepoe,
} from '../src/agenda.js';

const expediente = { abertura: '07:00', fechamento: '22:00' };
const reserva = (id, data, inicio, fim, status = 'ATIVA') => ({
  id, data, hora_inicio: `${inicio}:00`, hora_fim: `${fim}:00`, status,
});

describe('separarReservas', () => {
  const agora = new Date('2026-01-10T10:30:00');

  test('próximas: ativas que ainda não terminaram, da mais próxima para a mais distante', () => {
    const { proximas } = separarReservas([
      reserva(1, '2026-01-12', '08:00', '09:00'),
      reserva(2, '2026-01-10', '10:00', '11:00'), // em andamento: ainda é próxima
      reserva(3, '2026-01-11', '14:00', '15:00'),
    ], agora);
    expect(proximas.map((r) => r.id)).toEqual([2, 3, 1]);
  });

  test('histórico: canceladas e já terminadas, da mais recente para a mais antiga', () => {
    const { historico } = separarReservas([
      reserva(1, '2026-01-09', '08:00', '09:00'),
      reserva(2, '2026-01-10', '08:00', '09:00'),
      reserva(3, '2026-01-15', '08:00', '09:00', 'CANCELADA'),
    ], agora);
    expect(historico.map((r) => r.id)).toEqual([3, 2, 1]);
  });

  test('usa o momento atual quando agora não é informado', () => {
    const { historico } = separarReservas([reserva(1, '2000-01-01', '08:00', '09:00')]);
    expect(historico).toHaveLength(1);
  });
});

describe('agruparPorData', () => {
  test('junta reservas seguidas do mesmo dia', () => {
    const grupos = agruparPorData([
      reserva(1, '2026-01-10', '08:00', '09:00'),
      reserva(2, '2026-01-10T00:00:00.000Z', '10:00', '11:00'),
      reserva(3, '2026-01-11', '08:00', '09:00'),
    ]);
    expect(grupos.map((g) => [g.data, g.reservas.map((r) => r.id)])).toEqual([
      ['2026-01-10', [1, 2]],
      ['2026-01-11', [3]],
    ]);
  });
});

describe('ocupacaoDaSala e situacaoDaSala', () => {
  const ocupadas = [
    { sala_id: 1, hora_inicio: '14:00:00', hora_fim: '15:00:00' },
    { sala_id: 1, hora_inicio: '09:00:00', hora_fim: '10:00:00' },
    { sala_id: 1, hora_inicio: '10:00:00', hora_fim: '11:30:00' }, // emendada na anterior
    { sala_id: 2, hora_inicio: '09:00:00', hora_fim: '12:00:00' },
  ];

  test('ocupacaoDaSala filtra a sala, ordena e corta os segundos', () => {
    expect(ocupacaoDaSala(1, ocupadas)).toEqual([
      { inicio: '09:00', fim: '10:00' },
      { inicio: '10:00', fim: '11:30' },
      { inicio: '14:00', fim: '15:00' },
    ]);
  });

  test('livre até a próxima reserva, ou até o fechamento', () => {
    expect(situacaoDaSala(1, ocupadas, expediente, '08:00')).toEqual({ tipo: 'livre', ate: '09:00' });
    expect(situacaoDaSala(1, ocupadas, expediente, '16:00')).toEqual({ tipo: 'livre', ate: '22:00' });
  });

  test('ocupada até o fim das reservas emendadas', () => {
    expect(situacaoDaSala(1, ocupadas, expediente, '09:30')).toEqual({ tipo: 'ocupada', ate: '11:30' });
  });

  test('fechada antes da abertura e depois do fechamento', () => {
    expect(situacaoDaSala(1, ocupadas, expediente, '06:59')).toEqual({ tipo: 'fechada' });
    expect(situacaoDaSala(1, ocupadas, expediente, '22:00')).toEqual({ tipo: 'fechada' });
  });
});

describe('proximoHorario', () => {
  test('sugere a próxima hora cheia, com 1 hora de duração', () => {
    expect(proximoHorario('10:30', expediente)).toEqual({ horaInicio: '11:00', horaFim: '12:00' });
    expect(proximoHorario('10:00', expediente)).toEqual({ horaInicio: '11:00', horaFim: '12:00' });
  });

  test('antes da abertura sugere o primeiro horário do dia', () => {
    expect(proximoHorario('05:10', expediente)).toEqual({ horaInicio: '07:00', horaFim: '08:00' });
  });

  test('não sugere nada quando não cabe mais 1 hora antes do fechamento', () => {
    expect(proximoHorario('21:00', expediente)).toBeNull();
    expect(proximoHorario('20:59', expediente)).toEqual({ horaInicio: '21:00', horaFim: '22:00' });
  });
});

describe('sobrepoe', () => {
  test('intervalos que só se encostam não se sobrepõem', () => {
    expect(sobrepoe({ inicio: '10:00', fim: '11:00' }, { inicio: '11:00', fim: '12:00' })).toBe(false);
    expect(sobrepoe({ inicio: '10:00', fim: '11:30' }, { inicio: '11:00', fim: '12:00' })).toBe(true);
  });
});

describe('horasNoMes', () => {
  test('soma só as reservas ativas do mês, com uma casa decimal', () => {
    expect(horasNoMes([
      reserva(1, '2026-01-10', '08:00', '09:30'),
      reserva(2, '2026-01-20', '14:00', '15:00'),
      reserva(3, '2026-01-21', '14:00', '18:00', 'CANCELADA'),
      reserva(4, '2026-02-01', '14:00', '15:00'),
    ], '2026-01')).toBe(2.5);
  });
});

describe('posicaoNoDia', () => {
  test('converte o horário em posição e largura dentro do expediente', () => {
    // Expediente de 15 h (900 min): das 10h às 13h = 180 min a partir de 180 min.
    expect(posicaoNoDia('10:00', '13:00', expediente)).toEqual({ esquerda: 20, largura: 20 });
  });

  test('corta o que fica fora do expediente', () => {
    expect(posicaoNoDia('06:00', '07:00', expediente)).toEqual({ esquerda: 0, largura: 0 });
    expect(posicaoNoDia('21:00', '23:00', expediente).largura).toBeCloseTo(6.67, 1);
  });
});
