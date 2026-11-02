// Regra: uma reserva cancelada não pode mais ser editada.
const { ConflitoError } = require('../../erros');

class SomenteReservaAtiva {
  async validar(reserva) {
    if (!reserva.estaAtiva()) {
      throw new ConflitoError('Só é possível editar reservas ativas.');
    }
  }
}

module.exports = SomenteReservaAtiva;
