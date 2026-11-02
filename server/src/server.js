// Ponto de entrada do servidor: lê a configuração, monta as dependências
// pelo container e sobe a API.
const config = require('./config/ambiente');
const criarContainer = require('./container');

async function iniciar() {
  const { app, pool } = criarContainer(config);

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

  app.listen(config.porta, () => {
    console.log(`Servidor CatólicaReserva rodando em http://localhost:${config.porta}`);
  });
}

iniciar();
