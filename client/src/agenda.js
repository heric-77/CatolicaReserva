// Regras de exibição da agenda no cliente (funções puras, sem React).
// As regras de negócio de verdade (conflito, horário de funcionamento etc.)
// continuam no servidor; aqui só se organiza o que mostrar na tela.
import { formatarHora, minutos, paraHora } from './formatos.js';

const inicioDe = (r) => `${r.data.slice(0, 10)} ${r.hora_inicio}`;

// Separa as reservas em "próximas" (ativas que ainda não terminaram, da mais
// próxima para a mais distante) e "histórico" (o resto, da mais recente para a mais antiga).
export function separarReservas(reservas, agora = new Date()) {
  const proximas = [];
  const historico = [];
  for (const reserva of reservas) {
    const fim = new Date(`${reserva.data.slice(0, 10)}T${reserva.hora_fim}`);
    if (reserva.status === 'ATIVA' && fim > agora) proximas.push(reserva);
    else historico.push(reserva);
  }
  proximas.sort((a, b) => inicioDe(a).localeCompare(inicioDe(b)));
  historico.sort((a, b) => inicioDe(b).localeCompare(inicioDe(a)));
  return { proximas, historico };
}

// Agrupa reservas já ordenadas por data: [{ data, reservas: [...] }]
export function agruparPorData(reservas) {
  const grupos = [];
  for (const reserva of reservas) {
    const data = reserva.data.slice(0, 10);
    const ultimo = grupos.at(-1);
    if (ultimo?.data === data) ultimo.reservas.push(reserva);
    else grupos.push({ data, reservas: [reserva] });
  }
  return grupos;
}

// Horários ocupados de uma sala, em ordem: [{ inicio: 'HH:MM', fim: 'HH:MM' }]
export function ocupacaoDaSala(salaId, ocupadas) {
  return ocupadas
    .filter((o) => o.sala_id === salaId)
    .map((o) => ({ inicio: formatarHora(o.hora_inicio), fim: formatarHora(o.hora_fim) }))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

// Situação da sala em um horário do dia ('HH:MM'):
// { tipo: 'livre', ate } | { tipo: 'ocupada', ate } | { tipo: 'fechada' }
export function situacaoDaSala(salaId, ocupadas, { abertura, fechamento }, agora) {
  if (agora < abertura || agora >= fechamento) return { tipo: 'fechada' };
  const ocupacao = ocupacaoDaSala(salaId, ocupadas);
  const atual = ocupacao.find((o) => o.inicio <= agora && agora < o.fim);
  if (atual) {
    // Reservas emendadas contam como um único período ocupado.
    let ate = atual.fim;
    for (const o of ocupacao) if (o.inicio === ate) ate = o.fim;
    return { tipo: 'ocupada', ate };
  }
  const proxima = ocupacao.find((o) => o.inicio > agora);
  return { tipo: 'livre', ate: proxima ? proxima.inicio : fechamento };
}

// Próximo horário cheio (de 1 hora) que ainda dá para reservar hoje, ou null.
export function proximoHorario(agora, { abertura, fechamento }) {
  const proximaHoraCheia = (Math.floor(minutos(agora) / 60) + 1) * 60;
  const inicio = Math.max(proximaHoraCheia, minutos(abertura));
  if (inicio + 60 > minutos(fechamento)) return null;
  return { horaInicio: paraHora(inicio), horaFim: paraHora(inicio + 60) };
}

// Duas faixas de horário se sobrepõem?
export function sobrepoe(a, b) {
  return a.inicio < b.fim && b.inicio < a.fim;
}

// Total de horas das reservas ativas em um mês ('AAAA-MM').
export function horasNoMes(reservas, mes) {
  const total = reservas
    .filter((r) => r.status === 'ATIVA' && r.data.startsWith(mes))
    .reduce((soma, r) => soma + minutos(r.hora_fim) - minutos(r.hora_inicio), 0);
  return Math.round((total / 60) * 10) / 10;
}

// Posição de uma faixa de horário dentro do expediente, em % (para a linha do tempo).
export function posicaoNoDia(inicio, fim, { abertura, fechamento }) {
  const comeco = minutos(abertura);
  const duracao = minutos(fechamento) - comeco;
  const de = Math.max(minutos(inicio), comeco);
  const ate = Math.min(minutos(fim), minutos(fechamento));
  return {
    esquerda: ((de - comeco) / duracao) * 100,
    largura: (Math.max(ate - de, 0) / duracao) * 100,
  };
}
