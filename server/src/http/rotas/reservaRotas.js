const express = require('express');
const executar = require('./executar');
const { apenas } = require('../middlewares/autenticacao');

function criarReservaRotas({ reservaController, autenticar }) {
  const router = express.Router();

  // Todas as rotas de reserva exigem login.
  router.post('/', autenticar, executar(reservaController.criar));
  router.get('/minhas', autenticar, executar(reservaController.listarMinhas));
  router.get('/', autenticar, apenas('ADMIN'), executar(reservaController.listarTodas));
  router.patch('/:id/cancelar', autenticar, executar(reservaController.cancelar));

  return router;
}

module.exports = criarReservaRotas;
