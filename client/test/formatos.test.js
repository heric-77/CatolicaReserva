import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  formatarData,
  formatarDataPorExtenso,
  formatarHora,
  formatarHoraCheia,
  hojeISO,
  somarDias,
} from '../src/formatos.js';

describe('formatos', () => {
  afterEach(() => vi.useRealTimers());

  test('hojeISO usa a data local no formato AAAA-MM-DD', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 0, 5, 9, 30));
    expect(hojeISO()).toBe('2026-01-05');
  });

  test('somarDias atravessa meses e anos', () => {
    expect(somarDias('2026-01-31', 1)).toBe('2026-02-01');
    expect(somarDias('2026-01-01', -1)).toBe('2025-12-31');
  });

  test('formatarData converte para DD/MM/AAAA e aceita vazio', () => {
    expect(formatarData('2026-03-09')).toBe('09/03/2026');
    expect(formatarData('2026-03-09T00:00:00.000Z')).toBe('09/03/2026');
    expect(formatarData('')).toBe('');
  });

  test('formatarDataPorExtenso escreve o dia da semana e o mês', () => {
    expect(formatarDataPorExtenso('2026-11-03')).toBe('terça-feira, 3 de novembro');
  });

  test('formatarHora corta os segundos e aceita vazio', () => {
    expect(formatarHora('10:30:00')).toBe('10:30');
    expect(formatarHora(null)).toBe('');
  });

  test('formatarHoraCheia completa com dois dígitos', () => {
    expect(formatarHoraCheia(7)).toBe('07:00');
    expect(formatarHoraCheia(21)).toBe('21:00');
  });
});
