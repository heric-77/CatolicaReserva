// ReservaService - orquestra o caso de uso das reservas.
// Não sabe QUAIS regras existem nem COMO os dados são gravados:
// recebe tudo pronto no construtor (injeção de dependência).
const Reserva = require('../dominio/entidades/Reserva');
const { NaoEncontradoError } = require('../dominio/erros');
const ReservaRepository = require('../dominio/contratos/ReservaRepository');
const RegraReserva = require('../dominio/contratos/RegraReserva');
const RegraCancelamento = require('../dominio/contratos/RegraCancelamento');

class ReservaService {
  constructor({ reservaRepository, regrasDeCriacao = [], regrasDeCancelamento = [] }) {
    this.reservaRepository = ReservaRepository.verificar(reservaRepository);
    this.regrasDeCriacao = regrasDeCriacao.map((regra) => RegraReserva.verificar(regra));
    this.regrasDeCancelamento = regrasDeCancelamento.map((regra) =>
      RegraCancelamento.verificar(regra)
    );
  }

  async criar({ usuarioId, salaId, data, horaInicio, horaFim }) {
    const reserva = new Reserva({ usuarioId, salaId, data, horaInicio, horaFim });
    // As regras rodam na ordem em que foram registradas no container.
    for (const regra of this.regrasDeCriacao) {
      await regra.validar(reserva);
    }
    return this.reservaRepository.salvar(reserva);
  }

  async cancelar(id, usuario) {
    const reserva = await this.reservaRepository.buscarPorId(id);
    if (!reserva) {
      throw new NaoEncontradoError('Reserva não encontrada.');
    }
    for (const regra of this.regrasDeCancelamento) {
      await regra.validar(reserva, usuario);
    }
    reserva.cancelar();
    return this.reservaRepository.atualizarStatus(reserva.id, reserva.status);
  }

  async listarMinhas(usuarioId) {
    return this.reservaRepository.listarPorUsuario(usuarioId);
  }

  async listarTodas() {
    return this.reservaRepository.listarTodas();
  }
}

module.exports = ReservaService;
