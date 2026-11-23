import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  agoraHHMM,
  capitalizar,
  formatarData,
  formatarDataPorExtenso,
  formatarDuracao,
  formatarHora,
  formatarHoraCheia,
  hojeISO,
  iniciais,
  listaDeRecursos,
  minutos,
  nomeDoMes,
  paraHora,
  partesDaData,
  primeiroNome,
  rotuloDoDia,
  saudacao,
  somarDias,
  somarMinutos,
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

  test('rotuloDoDia usa Hoje, Amanhã e Ontem e, nos outros dias, a data por extenso', () => {
    const hoje = '2026-11-03';
    expect(rotuloDoDia('2026-11-03', hoje)).toBe('Hoje');
    expect(rotuloDoDia('2026-11-04T00:00:00.000Z', hoje)).toBe('Amanhã');
    expect(rotuloDoDia('2026-11-02', hoje)).toBe('Ontem');
    expect(rotuloDoDia('2026-11-10', hoje)).toBe('Terça-feira, 10 de novembro');
  });

  test('rotuloDoDia compara com a data de hoje quando ela não é informada', () => {
    expect(rotuloDoDia(hojeISO())).toBe('Hoje');
  });

  test('capitalizar e nomeDoMes', () => {
    expect(capitalizar('domingo')).toBe('Domingo');
    expect(nomeDoMes('2026-11-03')).toBe('novembro');
  });

  test('formatarHora corta os segundos e aceita vazio', () => {
    expect(formatarHora('10:30:00')).toBe('10:30');
    expect(formatarHora(null)).toBe('');
  });

  test('formatarHoraCheia completa com dois dígitos', () => {
    expect(formatarHoraCheia(7)).toBe('07:00');
    expect(formatarHoraCheia(21)).toBe('21:00');
  });

  test('minutos, paraHora e somarMinutos convertem e somam horários', () => {
    expect(minutos('10:30:00')).toBe(630);
    expect(paraHora(630)).toBe('10:30');
    expect(somarMinutos('10:30', 90)).toBe('12:00');
    expect(somarMinutos('23:00', 120)).toBe('23:59');
  });

  test('formatarDuracao escreve minutos, horas ou os dois', () => {
    expect(formatarDuracao('10:00', '10:30')).toBe('30 min');
    expect(formatarDuracao('10:00', '12:00')).toBe('2 h');
    expect(formatarDuracao('10:00', '11:30')).toBe('1 h 30 min');
  });

  test('agoraHHMM e saudacao dependem da hora', () => {
    expect(agoraHHMM(new Date(2026, 0, 5, 9, 5))).toBe('09:05');
    expect(saudacao(new Date(2026, 0, 5, 9))).toBe('Bom dia');
    expect(saudacao(new Date(2026, 0, 5, 12))).toBe('Boa tarde');
    expect(saudacao(new Date(2026, 0, 5, 18))).toBe('Boa noite');
  });

  test('agoraHHMM e saudacao usam o momento atual quando ele não é informado', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 0, 5, 14, 7));
    expect(agoraHHMM()).toBe('14:07');
    expect(saudacao()).toBe('Boa tarde');
  });

  test('partesDaData separa o dia e o mês abreviado', () => {
    expect(partesDaData('2026-11-03')).toEqual({ dia: '03', mes: 'nov' });
    expect(partesDaData('2026-05-21T00:00:00.000Z')).toEqual({ dia: '21', mes: 'mai' });
  });

  test('iniciais usa a primeira letra do primeiro e do último nome', () => {
    expect(iniciais('Ana Maria Souza')).toBe('AS');
    expect(iniciais('  carla  ')).toBe('C');
    expect(iniciais('')).toBe('?');
    expect(iniciais()).toBe('?');
  });

  test('primeiroNome e listaDeRecursos', () => {
    expect(primeiroNome(' Ana Maria Souza')).toBe('Ana');
    expect(primeiroNome()).toBe('');
    expect(listaDeRecursos('Projetor, quadro branco, ,TV')).toEqual(['Projetor', 'quadro branco', 'TV']);
    expect(listaDeRecursos()).toEqual([]);
  });
});
