// Regra: só é possível reservar uma sala que existe.
const { NaoEncontradoError } = require('../../erros');
const SalaRepository = require('../../contratos/SalaRepository');

class SalaDeveExistir {
  constructor({ salaRepository }) {
    this.salaRepository = SalaRepository.verificar(salaRepository);
  }

  async validar(reserva) {
    const sala = await this.salaRepository.buscarPorId(reserva.salaId);
    if (!sala) {
      throw new NaoEncontradoError('Sala não encontrada.');
    }
  }
}

module.exports = SalaDeveExistir;
