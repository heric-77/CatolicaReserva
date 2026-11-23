import { describe, expect, test } from 'vitest';
import { validarCadastro, validarReserva, validarSala } from '../src/validacoes.js';

const agora = new Date('2026-01-10T09:00:00');
const reserva = { salaId: 1, data: '2026-01-10', horaInicio: '10:00', horaFim: '11:00' };

describe('validarReserva', () => {
  test('aceita uma reserva completa no futuro', () => {
    expect(validarReserva(reserva, agora)).toBeNull();
  });

  test.each([
    [{ salaId: 0 }, 'Escolha uma sala.'],
    [{ data: '' }, 'Informe a data.'],
    [{ horaInicio: '' }, 'Informe a hora de início e a hora de fim.'],
    [{ horaFim: '' }, 'Informe a hora de início e a hora de fim.'],
    [{ horaFim: '10:00' }, 'A hora de fim deve ser maior que a hora de início.'],
    [{ horaInicio: '08:00', horaFim: '08:30' }, 'Escolha uma data e um horário que ainda não passaram.'],
  ])('com %o devolve "%s"', (alteracao, mensagem) => {
    expect(validarReserva({ ...reserva, ...alteracao }, agora)).toBe(mensagem);
  });

  test('usa o momento atual quando agora não é informado', () => {
    expect(validarReserva({ ...reserva, data: '2000-01-01' })).toMatch(/ainda não passaram/);
  });
});

describe('validarSala', () => {
  test('aceita nome e capacidade inteira positiva', () => {
    expect(validarSala({ nome: 'Lab', capacidade: '10' })).toBeNull();
  });

  test('recusa nome em branco', () => {
    expect(validarSala({ nome: '   ', capacidade: '10' })).toBe('Informe o nome da sala.');
  });

  test.each(['0', '-2', '2.5', 'abc'])('recusa capacidade %s', (capacidade) => {
    expect(validarSala({ nome: 'Lab', capacidade })).toMatch(/inteiro maior que zero/);
  });
});

describe('validarCadastro', () => {
  test('exige o nome', () => {
    expect(validarCadastro({ nome: ' ' })).toBe('Informe o seu nome.');
    expect(validarCadastro({ nome: 'Ana' })).toBeNull();
  });
});
