// Regra: a data precisa existir e as horas precisam estar no formato certo.
const { DadosInvalidosError } = require('../../erros');
const { ehDataValida, ehHoraValida } = require('../../formatos');

class FormatoDeDataEHora {
  async validar(reserva) {
    if (!ehDataValida(reserva.data)) {
      throw new DadosInvalidosError('Informe uma data válida.');
    }
    if (!ehHoraValida(reserva.horaInicio) || !ehHoraValida(reserva.horaFim)) {
      throw new DadosInvalidosError('Informe um horário válido.');
    }
  }
}

module.exports = FormatoDeDataEHora;
