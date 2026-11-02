const express = require('express');
const executar = require('./executar');
const { apenas } = require('../middlewares/autenticacao');

function criarUsuarioRotas({ usuarioController, autenticar }) {
  const router = express.Router();

  // Todas as rotas de gestão de usuários são exclusivas do administrador.
  router.use(autenticar, apenas('ADMIN'));

  router.get('/', executar(usuarioController.listar));
  router.patch('/:id(\\d+)/tipo', executar(usuarioController.alterarTipo));
  router.delete('/:id(\\d+)', executar(usuarioController.remover));

  return router;
}

module.exports = criarUsuarioRotas;
