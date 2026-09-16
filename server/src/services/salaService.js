// SalaService - regras de negócio das salas.
const salaRepository = require('../repositories/salaRepository');

const TIPOS_VALIDOS = ['SALA_ESTUDO', 'LABORATORIO'];

async function listar() {
  return salaRepository.listar();
}

async function criar({ nome, tipo, capacidade, recursos }) {
  if (!nome || !tipo || !capacidade) {
    const erro = new Error('Nome, tipo e capacidade são obrigatórios.');
    erro.status = 400;
    throw erro;
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    const erro = new Error('Tipo de sala inválido (use SALA_ESTUDO ou LABORATORIO).');
    erro.status = 400;
    throw erro;
  }
  if (Number(capacidade) <= 0) {
    const erro = new Error('A capacidade deve ser maior que zero.');
    erro.status = 400;
    throw erro;
  }
  return salaRepository.salvar({ nome, tipo, capacidade: Number(capacidade), recursos });
}

module.exports = { listar, criar };
