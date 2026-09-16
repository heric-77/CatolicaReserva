// ReservaController - recebe as requisições de reserva (criar, cancelar, listar).
const reservaService = require('../services/reservaService');

async function criar(req, res, next) {
  try {
    const { salaId, data, horaInicio, horaFim } = req.body;
    const reserva = await reservaService.criar({
      usuarioId: req.usuario.id, // vem do token (middleware de autenticação)
      salaId,
      data,
      horaInicio,
      horaFim,
    });
    res.status(201).json(reserva);
  } catch (err) {
    next(err);
  }
}

async function cancelar(req, res, next) {
  try {
    const reserva = await reservaService.cancelar(Number(req.params.id), req.usuario);
    res.json(reserva);
  } catch (err) {
    next(err);
  }
}

async function listarMinhas(req, res, next) {
  try {
    const reservas = await reservaService.listarMinhas(req.usuario.id);
    res.json(reservas);
  } catch (err) {
    next(err);
  }
}

async function listarTodas(req, res, next) {
  try {
    const reservas = await reservaService.listarTodas();
    res.json(reservas);
  } catch (err) {
    next(err);
  }
}

module.exports = { criar, cancelar, listarMinhas, listarTodas };
