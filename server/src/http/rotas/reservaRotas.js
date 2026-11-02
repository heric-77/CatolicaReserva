const express = require('express');
const executar = require('./executar');
const { apenas } = require('../middlewares/autenticacao');

function criarReservaRotas({ reservaController, autenticar }) {
  const router = express.Router();

  // Todas as rotas de reserva exigem login.
  router.post('/', autenticar, executar(reservaController.criar));
  router.get('/minhas', autenticar, executar(reservaController.listarMinhas));
  router.get('/', autenticar, apenas('ADMIN'), executar(reservaController.listarTodas));
  router.put('/:id(\\d+)', autenticar, executar(reservaController.editar));
  router.patch('/:id(\\d+)/cancelar', autenticar, executar(reservaController.cancelar));

  return router;
}

module.exports = criarReservaRotas;
