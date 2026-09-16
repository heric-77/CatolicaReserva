// Configuração do aplicativo Express (a "API REST" do C4).
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const salaRoutes = require('./routes/salaRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Rota simples para checar se a API está no ar.
app.get('/api', (req, res) => {
  res.json({ nome: 'CatólicaReserva API', status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/salas', salaRoutes);
app.use('/api/reservas', reservaRoutes);

// Tratamento de erros sempre por último.
app.use(errorHandler);

module.exports = app;
