// SalaService - casos de uso de cadastro e consulta das salas.
const Sala = require('../dominio/entidades/Sala');
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
}

module.exports = SalaService;
