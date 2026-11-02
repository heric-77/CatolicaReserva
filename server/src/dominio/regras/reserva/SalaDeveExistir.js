// Regra: só é possível reservar uma sala que existe.
const { NaoEncontradoError } = require('../../erros');
const ConsultaDeSala = require('../../contratos/ConsultaDeSala');

class SalaDeveExistir {
  constructor({ consultaDeSala }) {
    this.consultaDeSala = ConsultaDeSala.verificar(consultaDeSala);
  }

  async validar(reserva) {
    const sala = await this.consultaDeSala.buscarPorId(reserva.salaId);
    if (!sala) {
      throw new NaoEncontradoError('Sala não encontrada.');
    }
  }
}

module.exports = SalaDeveExistir;
