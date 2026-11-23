// Rótulos e formatação de datas e horas usados nas telas.
export const TIPO_SALA = { SALA_ESTUDO: 'Sala de estudo', LABORATORIO: 'Laboratório' };
export const TIPO_USUARIO = { ALUNO: 'Aluno', PROFESSOR: 'Professor', ADMIN: 'Administrador' };

function doisDigitos(numero) {
  return String(numero).padStart(2, '0');
}

function paraISO(data) {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

// Data de hoje no fuso do navegador, no formato 'AAAA-MM-DD'.
export function hojeISO() {
  return paraISO(new Date());
}

export function somarDias(iso, dias) {
  const data = new Date(`${iso}T12:00:00`);
  data.setDate(data.getDate() + dias);
  return paraISO(data);
}

// 'AAAA-MM-DD' -> 'DD/MM/AAAA'
export function formatarData(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

// 'AAAA-MM-DD' -> 'terça-feira, 3 de novembro'
export function formatarDataPorExtenso(iso) {
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// 'AAAA-MM-DD' -> 'Hoje', 'Amanhã', 'Ontem' ou 'Terça-feira, 3 de novembro'
export function rotuloDoDia(iso, hoje = hojeISO()) {
  const data = iso.slice(0, 10);
  if (data === hoje) return 'Hoje';
  if (data === somarDias(hoje, 1)) return 'Amanhã';
  if (data === somarDias(hoje, -1)) return 'Ontem';
  return capitalizar(formatarDataPorExtenso(data));
}

// 'AAAA-MM-DD' -> 'novembro'
export function nomeDoMes(iso) {
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { month: 'long' });
}

// 'HH:MM:SS' -> 'HH:MM'
export function formatarHora(hora) {
  return hora ? hora.slice(0, 5) : '';
}

export function formatarHoraCheia(hora) {
  return `${doisDigitos(hora)}:00`;
}

// 'HH:MM' ou 'HH:MM:SS' -> minutos desde a meia-noite
export function minutos(hora) {
  return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
}

// minutos desde a meia-noite -> 'HH:MM'
export function paraHora(total) {
  return `${doisDigitos(Math.floor(total / 60))}:${doisDigitos(total % 60)}`;
}

// '10:00' + 90 -> '11:30' (sem passar de 23:59)
export function somarMinutos(hora, quantidade) {
  return paraHora(Math.min(minutos(hora) + quantidade, 23 * 60 + 59));
}

// Duração entre duas horas: '30 min', '2 h' ou '1 h 30 min'
export function formatarDuracao(inicio, fim) {
  const total = minutos(fim) - minutos(inicio);
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (horas === 0) return `${resto} min`;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

// Hora atual no formato 'HH:MM'
export function agoraHHMM(agora = new Date()) {
  return `${doisDigitos(agora.getHours())}:${doisDigitos(agora.getMinutes())}`;
}

export function saudacao(agora = new Date()) {
  const hora = agora.getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

// 'AAAA-MM-DD' -> partes usadas no bloco de data das listas: { dia: '03', mes: 'nov' }
export function partesDaData(iso) {
  const [, , dia] = iso.slice(0, 10).split('-');
  const mes = new Date(`${iso.slice(0, 10)}T12:00:00`)
    .toLocaleDateString('pt-BR', { month: 'short' })
    .replace('.', '');
  return { dia, mes };
}

// 'Ana Maria Souza' -> 'AS' (avatar do usuário)
export function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes.at(-1)[0] : '';
  return (primeira + ultima).toUpperCase();
}

export function primeiroNome(nome = '') {
  return nome.trim().split(/\s+/)[0];
}

// 'Projetor, quadro branco' -> ['Projetor', 'quadro branco']
export function listaDeRecursos(recursos = '') {
  return recursos.split(',').map((r) => r.trim()).filter(Boolean);
}
