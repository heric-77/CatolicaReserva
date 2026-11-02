// Tratamento central de erros: traduz cada erro de domínio para o status HTTP.
// Para um tipo de erro novo, basta acrescentar uma linha na tabela.
const {
  DadosInvalidosError,
  CredenciaisInvalidasError,
  AcessoNegadoError,
  NaoEncontradoError,
  ConflitoError,
} = require('../../dominio/erros');

const STATUS_POR_ERRO = new Map([
  [DadosInvalidosError, 400],
  [CredenciaisInvalidasError, 401],
  [AcessoNegadoError, 403],
  [NaoEncontradoError, 404],
  [ConflitoError, 409],
]);

function statusDoErro(err) {
  for (const [TipoErro, status] of STATUS_POR_ERRO) {
    if (err instanceof TipoErro) return status;
  }
  return 500;
}

function errorHandler(err, req, res, next) {
  const status = statusDoErro(err);
  const mensagem = status === 500 ? 'Erro interno no servidor.' : err.message;
  if (status === 500) console.error(err);
  res.status(status).json({ erro: mensagem });
}

module.exports = errorHandler;
