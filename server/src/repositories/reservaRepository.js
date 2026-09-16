// ReservaRepository - persistência das reservas (mysql2).
const pool = require('../config/db');

// SELECT com JOIN para já trazer o nome da sala e do usuário.
const SELECT_BASE = `
  SELECT r.*, s.nome AS sala_nome, u.nome AS usuario_nome
  FROM reservas r
  JOIN salas s    ON s.id = r.sala_id
  JOIN usuarios u ON u.id = r.usuario_id
`;

async function salvar({ usuarioId, salaId, data, horaInicio, horaFim }) {
  const [resultado] = await pool.query(
    `INSERT INTO reservas (usuario_id, sala_id, data, hora_inicio, hora_fim, status)
     VALUES (?, ?, ?, ?, ?, 'ATIVA')`,
    [usuarioId, salaId, data, horaInicio, horaFim]
  );
  return buscarPorId(resultado.insertId);
}

async function buscarPorId(id) {
  const [linhas] = await pool.query(`${SELECT_BASE} WHERE r.id = ?`, [id]);
  return linhas[0] || null;
}

// Reservas ATIVAS de uma sala em uma data (usado para checar conflito de horário).
async function buscarPorSalaEData(salaId, data) {
  const [linhas] = await pool.query(
    `SELECT * FROM reservas WHERE sala_id = ? AND data = ? AND status = 'ATIVA'`,
    [salaId, data]
  );
  return linhas;
}

async function listarPorUsuario(usuarioId) {
  const [linhas] = await pool.query(
    `${SELECT_BASE} WHERE r.usuario_id = ? ORDER BY r.data DESC, r.hora_inicio`,
    [usuarioId]
  );
  return linhas;
}

async function listarTodas() {
  const [linhas] = await pool.query(`${SELECT_BASE} ORDER BY r.data DESC, r.hora_inicio`);
  return linhas;
}

async function atualizarStatus(id, status) {
  await pool.query('UPDATE reservas SET status = ? WHERE id = ?', [status, id]);
  return buscarPorId(id);
}

module.exports = {
  salvar,
  buscarPorId,
  buscarPorSalaEData,
  listarPorUsuario,
  listarTodas,
  atualizarStatus,
};
