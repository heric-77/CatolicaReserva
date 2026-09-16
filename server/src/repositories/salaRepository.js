// SalaRepository - persistência das salas (mysql2).
const pool = require('../config/db');

async function listar() {
  const [linhas] = await pool.query('SELECT * FROM salas ORDER BY nome');
  return linhas;
}

async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM salas WHERE id = ?', [id]);
  return linhas[0] || null;
}

async function salvar({ nome, tipo, capacidade, recursos }) {
  const [resultado] = await pool.query(
    'INSERT INTO salas (nome, tipo, capacidade, recursos) VALUES (?, ?, ?, ?)',
    [nome, tipo, capacidade, recursos || '']
  );
  return { id: resultado.insertId, nome, tipo, capacidade, recursos };
}

module.exports = { listar, buscarPorId, salvar };
