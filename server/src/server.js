// Ponto de entrada do servidor.
require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 3001;

async function iniciar() {
  try {
    // Testa a conexão com o banco antes de subir o servidor.
    const conexao = await pool.getConnection();
    await conexao.ping();
    conexao.release();
    console.log('Conectado ao banco de dados MySQL.');
  } catch (err) {
    console.error('Não foi possível conectar ao MySQL. Verifique o arquivo .env e se o banco está rodando.');
    console.error(err.message);
    // Segue subindo o servidor mesmo assim, para facilitar o desenvolvimento.
  }

  app.listen(PORT, () => {
    console.log(`Servidor CatólicaReserva rodando em http://localhost:${PORT}`);
  });
}

iniciar();
