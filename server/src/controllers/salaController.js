// SalaController - recebe as requisições de cadastro e consulta de salas.
const salaService = require('../services/salaService');

async function listar(req, res, next) {
  try {
    const salas = await salaService.listar();
    res.json(salas);
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  try {
    const sala = await salaService.criar(req.body);
    res.status(201).json(sala);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, criar };
