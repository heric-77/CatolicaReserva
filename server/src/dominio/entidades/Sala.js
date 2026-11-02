// Entidade Sala (sala de estudo ou laboratório).
const { DadosInvalidosError } = require('../erros');

const TIPOS = Object.freeze({
  SALA_ESTUDO: 'SALA_ESTUDO',
  LABORATORIO: 'LABORATORIO',
});

class Sala {
  constructor({ id = null, nome, tipo, capacidade, recursos = '' }) {
    this.id = id;
    this.nome = nome;
    this.tipo = tipo;
    this.capacidade = capacidade;
    this.recursos = recursos || '';
  }

  // Cria uma sala nova validando seus dados (usado no cadastro).
  static criar({ nome, tipo, capacidade, recursos }) {
    if (!nome || !tipo || !capacidade) {
      throw new DadosInvalidosError('Nome, tipo e capacidade são obrigatórios.');
    }
    if (!Object.values(TIPOS).includes(tipo)) {
      throw new DadosInvalidosError('Tipo de sala inválido (use SALA_ESTUDO ou LABORATORIO).');
    }
    if (Number(capacidade) <= 0) {
      throw new DadosInvalidosError('A capacidade deve ser maior que zero.');
    }
    return new Sala({ nome, tipo, capacidade: Number(capacidade), recursos });
  }
}

Sala.TIPOS = TIPOS;

module.exports = Sala;
