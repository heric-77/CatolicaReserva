// GestaoDeUsuariosService - casos de uso de administração dos usuários.
// O administrador não pode alterar o próprio tipo nem se excluir: assim o
// sistema nunca fica sem nenhum administrador.
const Usuario = require('../dominio/entidades/Usuario');
const { AcessoNegadoError, NaoEncontradoError } = require('../dominio/erros');
const GestaoDeUsuariosRepository = require('../dominio/contratos/GestaoDeUsuariosRepository');

class GestaoDeUsuariosService {
  constructor({ gestaoDeUsuariosRepository }) {
    this.repository = GestaoDeUsuariosRepository.verificar(gestaoDeUsuariosRepository);
  }

  async listar() {
    return this.repository.listar();
  }

  async alterarTipo(id, tipo, solicitante) {
    Usuario.validarTipo(tipo);
    await this.#garantirQueExiste(id);
    if (id === solicitante.id) {
      throw new AcessoNegadoError('Você não pode alterar o próprio tipo de usuário.');
    }
    return this.repository.atualizarTipo(id, tipo);
  }

  async remover(id, solicitante) {
    await this.#garantirQueExiste(id);
    if (id === solicitante.id) {
      throw new AcessoNegadoError('Você não pode excluir o próprio usuário.');
    }
    await this.repository.remover(id);
  }

  async #garantirQueExiste(id) {
    if (!(await this.repository.buscarPorId(id))) {
      throw new NaoEncontradoError('Usuário não encontrado.');
    }
  }
}

module.exports = GestaoDeUsuariosService;
