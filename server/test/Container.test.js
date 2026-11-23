const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const criarContainer = require('../src/container');
const config = require('../src/config/ambiente');

describe('container (Composition Root)', () => {
  test('monta o app com todas as dependências sem precisar conectar ao banco', async () => {
    // O pool do mysql2 só abre conexão na primeira consulta.
    const { app, pool } = criarContainer(config);
    try {
      assert.equal(typeof app, 'function');
      assert.equal(typeof app.listen, 'function');
      assert.equal(typeof pool.getConnection, 'function');
    } finally {
      await pool.end();
    }
  });
});

// Carrega o config/ambiente de novo com outras variáveis de ambiente.
// Uma variável vazia ('') também impede o dotenv de preenchê-la pelo arquivo .env.
const VARIAVEIS = ['PORT', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET', 'CORS_ORIGIN'];

function carregarAmbiente(valores) {
  const caminho = require.resolve('../src/config/ambiente');
  const anteriores = Object.fromEntries(VARIAVEIS.map((nome) => [nome, process.env[nome]]));
  try {
    for (const nome of VARIAVEIS) process.env[nome] = valores[nome] ?? '';
    delete require.cache[caminho];
    return require(caminho);
  } finally {
    for (const [nome, valor] of Object.entries(anteriores)) {
      if (valor === undefined) delete process.env[nome];
      else process.env[nome] = valor;
    }
    delete require.cache[caminho];
  }
}

describe('config/ambiente', () => {
  test('usa os valores padrão quando as variáveis não estão definidas', () => {
    const padrao = carregarAmbiente({});
    assert.equal(padrao.porta, 3001);
    assert.deepEqual(padrao.banco, {
      host: 'localhost', port: 3306, user: 'root', password: '', database: 'catolicareserva',
    });
    assert.equal(padrao.jwt.segredo, 'troque-este-segredo');
    assert.equal(padrao.cors.origem, 'http://localhost:5173');
  });

  test('lê os valores das variáveis de ambiente', () => {
    const lido = carregarAmbiente({
      PORT: '4000', DB_HOST: 'banco', DB_PORT: '3307', DB_USER: 'app', DB_PASSWORD: 'senha',
      DB_NAME: 'reservas', JWT_SECRET: 'segredo-forte', CORS_ORIGIN: 'https://reservas.exemplo.edu.br',
    });
    assert.equal(lido.porta, 4000);
    assert.deepEqual(lido.banco, { host: 'banco', port: 3307, user: 'app', password: 'senha', database: 'reservas' });
    assert.equal(lido.jwt.segredo, 'segredo-forte');
    assert.equal(lido.cors.origem, 'https://reservas.exemplo.edu.br');
  });

  test('tem os limites das regras de reserva e valores padrão', () => {
    assert.equal(typeof config.porta, 'number');
    assert.equal(typeof config.jwt.segredo, 'string');
    assert.deepEqual(config.reservas, {
      abertura: '07:00',
      fechamento: '22:00',
      duracaoMaximaEmMinutos: 240,
      antecedenciaMaximaEmDias: 30,
    });
  });
});
