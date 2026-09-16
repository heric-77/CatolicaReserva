// UsuarioRepository - responsável apenas pela persistência dos usuários (mysql2).
const pool = require('../config/db');

async function buscarPorEmail(email) {
  const [linhas] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  return linhas[0] || null;
}

async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
  return linhas[0] || null;
}

async function salvar({ nome, email, senha, tipo }) {
  const [resultado] = await pool.query(
    'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
    [nome, email, senha, tipo]
  );
  return { id: resultado.insertId, nome, email, tipo };
}

module.exports = { buscarPorEmail, buscarPorId, salvar };
