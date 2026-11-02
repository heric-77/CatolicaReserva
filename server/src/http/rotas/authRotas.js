const express = require('express');
const executar = require('./executar');

function criarAuthRotas({ authController }) {
  const router = express.Router();

  router.post('/registrar', executar(authController.registrar));
  router.post('/login', executar(authController.login));

  return router;
}

module.exports = criarAuthRotas;
