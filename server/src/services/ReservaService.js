// ReservaService - orquestra o caso de uso das reservas.
// Não sabe QUAIS regras existem nem COMO os dados são gravados:
// recebe tudo pronto no construtor (injeção de dependência).
const Reserva = require('../dominio/entidades/Reserva');
const { NaoEncontradoError } = require('../dominio/erros');
const ReservaRepository = require('../dominio/contratos/ReservaRepository');
const RegraReserva = require('../dominio/contratos/RegraReserva');
const RegraAlteracao = require('../dominio/contratos/RegraAlteracao');

class ReservaService {
  constructor({
    reservaRepository,
    regrasDeReserva = [],
    regrasDeEdicao = [],
    regrasDeCancelamento = [],
  }) {
    this.reservaRepository = ReservaRepository.verificar(reservaRepository);
    this.regrasDeReserva = regrasDeReserva.map((regra) => RegraReserva.verificar(regra));
    this.regrasDeEdicao = regrasDeEdicao.map((regra) => RegraAlteracao.verificar(regra));
    this.regrasDeCancelamento = regrasDeCancelamento.map((regra) => RegraAlteracao.verificar(regra));
  }

  async criar({ usuarioId, salaId, data, horaInicio, horaFim }) {
    const reserva = new Reserva({ usuarioId, salaId, data, horaInicio, horaFim });
    await this.#validarReserva(reserva);
    return this.reservaRepository.salvar(reserva);
  }

  async editar(id, dados, usuario) {
    const reserva = await this.#buscar(id);
    for (const regra of this.regrasDeEdicao) {
      await regra.validar(reserva, usuario);
    }
    const alterada = reserva.comAlteracoes(dados);
    await this.#validarReserva(alterada);
    return this.reservaRepository.atualizar(alterada);
  }

  async cancelar(id, usuario) {
    const reserva = await this.#buscar(id);
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

  // As regras rodam na ordem em que foram registradas no container.
  async #validarReserva(reserva) {
    for (const regra of this.regrasDeReserva) {
      await regra.validar(reserva);
    }
  }

  async #buscar(id) {
    const reserva = await this.reservaRepository.buscarPorId(id);
    if (!reserva) {
      throw new NaoEncontradoError('Reserva não encontrada.');
    }
    return reserva;
  }
}

module.exports = ReservaService;
