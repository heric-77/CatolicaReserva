// Regra: uma reserva não pode durar mais que o limite configurado.
const { DadosInvalidosError } = require('../../erros');

class LimiteDeDuracao {
  constructor({ maximoEmMinutos }) {
    this.maximoEmMinutos = maximoEmMinutos;
  }

  async validar(reserva) {
    if (reserva.duracaoEmMinutos() > this.maximoEmMinutos) {
      const horas = this.maximoEmMinutos / 60;
      throw new DadosInvalidosError(`Uma reserva pode durar no máximo ${horas} horas.`);
    }
  }
}

module.exports = LimiteDeDuracao;
