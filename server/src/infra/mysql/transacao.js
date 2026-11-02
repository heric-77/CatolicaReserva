// Executa várias operações como uma só: ou todas são gravadas, ou nenhuma.
async function emTransacao(pool, operacoes) {
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    await operacoes(conexao);
    await conexao.commit();
  } catch (err) {
    await conexao.rollback();
    throw err;
  } finally {
    conexao.release();
  }
}

module.exports = { emTransacao };
