// Regra: só é possível reservar até um certo número de dias à frente.
const { DadosInvalidosError } = require('../../erros');

const MS_POR_DIA = 24 * 60 * 60 * 1000;

class AntecedenciaMaxima {
  constructor({ maximoEmDias, agora = () => new Date() }) {
    this.maximoEmDias = maximoEmDias;
    this.agora = agora;
  }

  async validar(reserva) {
    if (reserva.inicio() - this.agora() > this.maximoEmDias * MS_POR_DIA) {
      throw new DadosInvalidosError(
        `Só é possível reservar com até ${this.maximoEmDias} dias de antecedência.`
      );
    }
  }
}

module.exports = AntecedenciaMaxima;
