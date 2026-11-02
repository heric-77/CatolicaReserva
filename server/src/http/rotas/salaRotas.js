const express = require('express');
const executar = require('./executar');
const { apenas } = require('../middlewares/autenticacao');

function criarSalaRotas({ salaController, autenticar }) {
  const router = express.Router();

  // Qualquer usuário logado pode ver as salas.
  router.get('/', autenticar, executar(salaController.listar));

  // Apenas o administrador pode cadastrar novas salas.
  router.post('/', autenticar, apenas('ADMIN'), executar(salaController.criar));

  return router;
}

module.exports = criarSalaRotas;
