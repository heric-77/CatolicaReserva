// Entidade Reserva: uma sala reservada por um usuário em uma data e horário.
const STATUS = Object.freeze({
  ATIVA: 'ATIVA',
  CANCELADA: 'CANCELADA',
});

// Padroniza a hora em 'HH:MM:SS'. O formulário envia '10:00' e o banco
// devolve '10:00:00'; sem padronizar, a comparação de texto falha.
function normalizarHora(hora) {
  if (typeof hora !== 'string') return hora;
  return /^\d{2}:\d{2}$/.test(hora) ? `${hora}:00` : hora;
}

class Reserva {
  constructor({
    id = null,
    usuarioId,
    salaId,
    data,
    horaInicio,
    horaFim,
    status = STATUS.ATIVA,
    salaNome = null,
    usuarioNome = null,
  }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.salaId = salaId;
    this.data = data;
    this.horaInicio = normalizarHora(horaInicio);
    this.horaFim = normalizarHora(horaFim);
    this.status = status;
    this.salaNome = salaNome;
    this.usuarioNome = usuarioNome;
  }

  // Dois intervalos [inicioA, fimA) e [inicioB, fimB) se sobrepõem
  // quando inicioA < fimB E inicioB < fimA.
  sobrepoe(outra) {
    return this.horaInicio < outra.horaFim && outra.horaInicio < this.horaFim;
  }

  pertenceA(usuarioId) {
    return this.usuarioId === usuarioId;
  }

  cancelar() {
    this.status = STATUS.CANCELADA;
  }
}

Reserva.STATUS = STATUS;

module.exports = Reserva;
