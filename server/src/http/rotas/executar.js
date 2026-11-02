// Repassa para o errorHandler qualquer erro lançado por um método async
// do controller (evita repetir try/catch em todos os métodos).
function executar(acao) {
  return (req, res, next) => Promise.resolve(acao(req, res)).catch(next);
}

module.exports = executar;
