// Regra: a hora de fim precisa ser depois da hora de início.
const { DadosInvalidosError } = require('../../erros');

class HorarioValido {
  async validar(reserva) {
    if (reserva.horaFim <= reserva.horaInicio) {
      throw new DadosInvalidosError('A hora de fim deve ser maior que a hora de início.');
    }
  }
}

module.exports = HorarioValido;
