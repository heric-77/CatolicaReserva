const express = require('express');
const executar = require('./executar');

function criarAgendaRotas({ agendaController, autenticar }) {
  const router = express.Router();

  // Qualquer usuário logado pode consultar a disponibilidade: GET /api/agenda?data=AAAA-MM-DD
  router.get('/', autenticar, executar(agendaController.doDia));

  return router;
}

module.exports = criarAgendaRotas;
