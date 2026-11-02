// SalaService - casos de uso de cadastro, consulta, edição e exclusão das salas.
const Sala = require('../dominio/entidades/Sala');
const { NaoEncontradoError } = require('../dominio/erros');
const SalaRepository = require('../dominio/contratos/SalaRepository');

class SalaService {
  constructor({ salaRepository }) {
    this.salaRepository = SalaRepository.verificar(salaRepository);
  }

  async listar() {
    return this.salaRepository.listar();
  }

  async criar(dados) {
    const sala = Sala.criar(dados); // a própria entidade valida seus dados
    return this.salaRepository.salvar(sala);
  }

  async atualizar(id, dados) {
    await this.#garantirQueExiste(id);
    const sala = new Sala({ ...Sala.criar(dados), id });
    return this.salaRepository.atualizar(sala);
  }

  async remover(id) {
    await this.#garantirQueExiste(id);
    await this.salaRepository.remover(id);
  }

  async #garantirQueExiste(id) {
    if (!(await this.salaRepository.buscarPorId(id))) {
      throw new NaoEncontradoError('Sala não encontrada.');
    }
  }
}

module.exports = SalaService;
