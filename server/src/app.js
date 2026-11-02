// Configuração do aplicativo Express (a "API REST" do C4).
// Recebe os controllers já montados pelo container (não cria nada sozinho).
const express = require('express');
const cors = require('cors');

const criarAuthRotas = require('./http/rotas/authRotas');
const criarSalaRotas = require('./http/rotas/salaRotas');
const criarReservaRotas = require('./http/rotas/reservaRotas');
const errorHandler = require('./http/middlewares/errorHandler');

function criarApp({ authController, salaController, reservaController, autenticar }) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Rota simples para checar se a API está no ar.
  app.get('/api', (req, res) => {
    res.json({ nome: 'CatólicaReserva API', status: 'ok' });
  });

  app.use('/api/auth', criarAuthRotas({ authController }));
  app.use('/api/salas', criarSalaRotas({ salaController, autenticar }));
  app.use('/api/reservas', criarReservaRotas({ reservaController, autenticar }));

  // Tratamento de erros sempre por último.
  app.use(errorHandler);

  return app;
}

module.exports = criarApp;
