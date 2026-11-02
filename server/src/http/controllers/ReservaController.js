// ReservaController - recebe as requisições de reserva (criar, cancelar, listar).
const { apresentarReserva } = require('../apresentadores/apresentadores');

class ReservaController {
  constructor({ reservaService }) {
    this.reservaService = reservaService;
  }

  criar = async (req, res) => {
    const { salaId, data, horaInicio, horaFim } = req.body;
    const reserva = await this.reservaService.criar({
      usuarioId: req.usuario.id, // vem do token (middleware de autenticação)
      salaId,
      data,
      horaInicio,
      horaFim,
    });
    res.status(201).json(apresentarReserva(reserva));
  };

  cancelar = async (req, res) => {
    const reserva = await this.reservaService.cancelar(Number(req.params.id), req.usuario);
    res.json(apresentarReserva(reserva));
  };

  listarMinhas = async (req, res) => {
    const reservas = await this.reservaService.listarMinhas(req.usuario.id);
    res.json(reservas.map(apresentarReserva));
  };

  listarTodas = async (req, res) => {
    const reservas = await this.reservaService.listarTodas();
    res.json(reservas.map(apresentarReserva));
  };
}

module.exports = ReservaController;
