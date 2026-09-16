const express = require('express');
const salaController = require('../controllers/salaController');
const { autenticar, apenas } = require('../middlewares/auth');

const router = express.Router();

// Qualquer usuário logado pode ver as salas.
router.get('/', autenticar, salaController.listar);

// Apenas o administrador pode cadastrar novas salas.
router.post('/', autenticar, apenas('ADMIN'), salaController.criar);

module.exports = router;
