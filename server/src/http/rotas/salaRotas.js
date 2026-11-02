const express = require('express');
const executar = require('./executar');
const { apenas } = require('../middlewares/autenticacao');

function criarSalaRotas({ salaController, autenticar }) {
  const router = express.Router();

  // Qualquer usuário logado pode ver as salas.
  router.get('/', autenticar, executar(salaController.listar));

  // Apenas o administrador pode cadastrar, editar e excluir salas.
  router.post('/', autenticar, apenas('ADMIN'), executar(salaController.criar));
  router.put('/:id(\\d+)', autenticar, apenas('ADMIN'), executar(salaController.atualizar));
  router.delete('/:id(\\d+)', autenticar, apenas('ADMIN'), executar(salaController.remover));

  return router;
}

module.exports = criarSalaRotas;
