const express = require('express');
const reservaController = require('../controllers/reservaController');
const { autenticar, apenas } = require('../middlewares/auth');

const router = express.Router();

// Todas as rotas de reserva exigem login.
router.post('/', autenticar, reservaController.criar);
router.get('/minhas', autenticar, reservaController.listarMinhas);
router.get('/', autenticar, apenas('ADMIN'), reservaController.listarTodas);
router.patch('/:id/cancelar', autenticar, reservaController.cancelar);

module.exports = router;
