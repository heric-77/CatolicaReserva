// Erros de domínio: descrevem O QUE deu errado na regra de negócio,
// sem saber nada de HTTP. Quem traduz cada erro para um status HTTP
// é o middleware errorHandler (camada http).
class ErroDeDominio extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = this.constructor.name;
  }
}

class DadosInvalidosError extends ErroDeDominio {}
class CredenciaisInvalidasError extends ErroDeDominio {}
class AcessoNegadoError extends ErroDeDominio {}
class NaoEncontradoError extends ErroDeDominio {}
class ConflitoError extends ErroDeDominio {}

module.exports = {
  ErroDeDominio,
  DadosInvalidosError,
  CredenciaisInvalidasError,
  AcessoNegadoError,
  NaoEncontradoError,
  ConflitoError,
};
