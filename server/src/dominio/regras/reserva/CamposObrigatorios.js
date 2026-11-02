// Regra: sala, data, hora de início e hora de fim precisam ser informadas.
const { DadosInvalidosError } = require('../../erros');

class CamposObrigatorios {
  async validar(reserva) {
    if (!reserva.salaId || !reserva.data || !reserva.horaInicio || !reserva.horaFim) {
      throw new DadosInvalidosError('Sala, data, hora de início e hora de fim são obrigatórias.');
    }
  }
}

module.exports = CamposObrigatorios;
