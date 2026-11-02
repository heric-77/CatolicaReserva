// Regra: a reserva precisa ficar dentro do horário de funcionamento da instituição.
const { DadosInvalidosError } = require('../../erros');

class HorarioDeFuncionamento {
  // abertura e fechamento no formato 'HH:MM'.
  constructor({ abertura, fechamento }) {
    this.abertura = abertura;
    this.fechamento = fechamento;
  }

  async validar(reserva) {
    if (reserva.horaInicio < `${this.abertura}:00` || reserva.horaFim > `${this.fechamento}:00`) {
      throw new DadosInvalidosError(
        `As reservas devem ficar entre ${this.abertura} e ${this.fechamento}.`
      );
    }
  }
}

module.exports = HorarioDeFuncionamento;
